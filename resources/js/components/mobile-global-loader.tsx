import { useEffect, useState } from 'react';
import { router } from '@inertiajs/react';
import { useIsMobile } from '@/hooks/use-mobile';

/**
 * Mobile Global Loader
 *
 * Appears exclusively on mobile view during:
 * - Page transfers (Inertia visits)
 * - Saving (Inertia form posts, puts, patches, deletes)
 * - Queries (Inertia gets, reloads, and async API queries)
 *
 * Renders a circular/round loader with 'ALAYON 2026' in the center.
 */
export function MobileGlobalLoader() {
    const isMobile = useIsMobile();
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!isMobile) {
            setIsLoading(false);
            return;
        }

        let activeCount = 0;
        let timeoutId: ReturnType<typeof setTimeout> | null = null;

        const startLoading = () => {
            activeCount++;
            setIsLoading(true);

            // Safety timeout: auto-hide after 15s to prevent stuck UI in case of network drops
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
            timeoutId = setTimeout(() => {
                activeCount = 0;
                setIsLoading(false);
            }, 15000);
        };

        const stopLoading = () => {
            activeCount = Math.max(0, activeCount - 1);
            if (activeCount === 0) {
                if (timeoutId) {
                    clearTimeout(timeoutId);
                }
                // Slight delay for smooth visual transition
                setTimeout(() => {
                    if (activeCount === 0) {
                        setIsLoading(false);
                    }
                }, 120);
            }
        };

        // Inertia router lifecycle hooks (covers page transitions, saves, queries)
        const unbindStart = router.on('start', () => {
            startLoading();
        });

        const unbindFinish = router.on('finish', () => {
            stopLoading();
        });

        const unbindError = router.on('error', () => {
            stopLoading();
        });

        const unbindCancel = router.on('cancel', () => {
            stopLoading();
        });

        // Intercept native fetch for API queries/saves, ignoring background host-poll
        const originalFetch = window.fetch;
        window.fetch = async (...args) => {
            const url =
                typeof args[0] === 'string'
                    ? args[0]
                    : (args[0] as Request)?.url || '';
            const isBackgroundPoll = url.includes('host-poll');

            if (!isBackgroundPoll && isMobile) {
                startLoading();
            }

            try {
                return await originalFetch(...args);
            } finally {
                if (!isBackgroundPoll && isMobile) {
                    stopLoading();
                }
            }
        };

        // Custom window event triggers for programmatic query/save loading
        const handleCustomStart = () => startLoading();
        const handleCustomStop = () => stopLoading();
        window.addEventListener('alayon:loading:start', handleCustomStart);
        window.addEventListener('alayon:loading:stop', handleCustomStop);

        return () => {
            unbindStart();
            unbindFinish();
            unbindError();
            unbindCancel();
            window.fetch = originalFetch;
            window.removeEventListener('alayon:loading:start', handleCustomStart);
            window.removeEventListener('alayon:loading:stop', handleCustomStop);
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
        };
    }, [isMobile]);

    if (!isMobile || !isLoading) {
        return null;
    }

    return (
        <div
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/65 backdrop-blur-xs select-none p-4 transition-all duration-200 md:hidden"
            role="status"
            aria-live="polite"
            aria-label="Loading Alayon 2026"
        >
            <div className="relative flex flex-col items-center justify-center">
                {/* Round Loader Container */}
                <div className="relative flex size-40 sm:size-44 items-center justify-center">
                    {/* Animated Circular Ring (SVG) */}
                    <svg
                        className="absolute inset-0 size-full -rotate-90 animate-spin"
                        viewBox="0 0 160 160"
                        style={{ animationDuration: '1.2s' }}
                    >
                        {/* Background track circle */}
                        <circle
                            cx="80"
                            cy="80"
                            r="68"
                            className="stroke-white/15"
                            strokeWidth="6"
                            fill="transparent"
                        />
                        {/* Foreground spinning progress circle */}
                        <circle
                            cx="80"
                            cy="80"
                            r="68"
                            stroke="url(#alayon-loader-gradient)"
                            strokeWidth="6"
                            strokeLinecap="round"
                            strokeDasharray="427"
                            strokeDashoffset="140"
                            fill="transparent"
                        />
                        <defs>
                            <linearGradient
                                id="alayon-loader-gradient"
                                x1="0%"
                                y1="0%"
                                x2="100%"
                                y2="100%"
                            >
                                <stop offset="0%" stopColor="#38bdf8" />
                                <stop offset="50%" stopColor="#6366f1" />
                                <stop offset="100%" stopColor="#f59e0b" />
                            </linearGradient>
                        </defs>
                    </svg>

                    {/* Secondary subtle pulsing ring */}
                    <div className="absolute inset-0 size-full rounded-full border-2 border-primary/20 animate-ping opacity-20 pointer-events-none" />

                    {/* Center Disc with 'ALAYON 2026' */}
                    <div className="size-28 sm:size-32 rounded-full bg-neutral-900/95 border border-white/20 shadow-2xl backdrop-blur-md flex flex-col items-center justify-center p-3 text-center z-10">
                        <span className="text-base sm:text-lg font-black tracking-widest text-white uppercase drop-shadow-md leading-none">
                            ALAYON
                        </span>
                        <span className="text-xs sm:text-sm font-bold tracking-widest text-amber-400 uppercase drop-shadow-xs mt-1 leading-none">
                            2026
                        </span>
                    </div>
                </div>

                {/* Subtitle status badge */}
                <div className="mt-4 flex items-center gap-2 rounded-full bg-neutral-900/85 border border-white/15 px-3.5 py-1 text-xs font-medium text-neutral-200 shadow-md">
                    <span className="size-2 rounded-full bg-amber-400 animate-pulse" />
                    <span>Processing...</span>
                </div>
            </div>
        </div>
    );
}

/**
 * Programmatic helper to trigger the mobile loader if needed by custom async operations.
 */
export function triggerMobileLoader(show: boolean) {
    if (typeof window !== 'undefined') {
        window.dispatchEvent(
            new CustomEvent(show ? 'alayon:loading:start' : 'alayon:loading:stop')
        );
    }
}

