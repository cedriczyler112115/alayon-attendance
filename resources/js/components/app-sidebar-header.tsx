import { Link } from '@inertiajs/react';
import { LayoutGrid, Maximize2, Minimize2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { Button } from '@/components/ui/button';
import { SidebarTrigger } from '@/components/ui/sidebar';
import type { BreadcrumbItem as BreadcrumbItemType } from '@/types';

export function AppSidebarHeader({
    breadcrumbs = [],
}: {
    breadcrumbs?: BreadcrumbItemType[];
}) {
    const [isFullscreen, setIsFullscreen] = useState(false);

    useEffect(() => {
        const handleFsChange = () => {
            setIsFullscreen(
                !!(
                    document.fullscreenElement ||
                    (
                        document as unknown as {
                            webkitFullscreenElement?: Element;
                        }
                    ).webkitFullscreenElement
                ),
            );
        };
        document.addEventListener('fullscreenchange', handleFsChange);
        document.addEventListener('webkitfullscreenchange', handleFsChange);
        return () => {
            document.removeEventListener('fullscreenchange', handleFsChange);
            document.removeEventListener(
                'webkitfullscreenchange',
                handleFsChange,
            );
        };
    }, []);

    const toggleMobileFullscreen = () => {
        const doc = document.documentElement as HTMLElement & {
            webkitRequestFullscreen?: () => Promise<void>;
            msRequestFullscreen?: () => Promise<void>;
        };
        const docWithExit = document as Document & {
            webkitExitFullscreen?: () => Promise<void>;
            msExitFullscreen?: () => Promise<void>;
            webkitFullscreenElement?: Element;
        };

        if (
            !document.fullscreenElement &&
            !docWithExit.webkitFullscreenElement
        ) {
            if (doc.requestFullscreen) {
                doc.requestFullscreen().catch(() => {});
            } else if (doc.webkitRequestFullscreen) {
                doc.webkitRequestFullscreen();
            } else if (doc.msRequestFullscreen) {
                doc.msRequestFullscreen();
            }
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen().catch(() => {});
            } else if (docWithExit.webkitExitFullscreen) {
                docWithExit.webkitExitFullscreen();
            }
        }

        // On mobile Safari, scrolling 1px down triggers address bar collapse
        if (window.pageYOffset === 0) {
            window.scrollTo(0, 1);
        }
    };

    return (
        <header className="sticky top-0 z-20 flex shrink-0 flex-col justify-end border-b border-sidebar-border/50 bg-background/95 pt-[max(0.75rem,env(safe-area-inset-top,0.75rem))] backdrop-blur-md transition-all md:pt-0">
            <div className="flex h-14 w-full items-center justify-between px-4 md:h-16 md:px-6">
                <div className="flex min-w-0 items-center gap-2">
                    <SidebarTrigger className="-ml-1" />
                    <Breadcrumbs breadcrumbs={breadcrumbs} />
                </div>

                {/* Mobile View: Hide Toolbar / Fullscreen & Menu Shortcut */}
                <div className="flex items-center gap-1.5 md:hidden">
                    <Button
                        variant="outline"
                        size="icon"
                        type="button"
                        onClick={toggleMobileFullscreen}
                        className="size-8 rounded-lg border-sidebar-border/60 text-muted-foreground shadow-2xs hover:text-foreground"
                        title={
                            isFullscreen
                                ? 'Exit Fullscreen'
                                : 'Hide Browser Toolbar (Fullscreen)'
                        }
                        aria-label={
                            isFullscreen
                                ? 'Exit Fullscreen'
                                : 'Hide Browser Toolbar'
                        }
                    >
                        {isFullscreen ? (
                            <Minimize2 className="size-3.5" />
                        ) : (
                            <Maximize2 className="size-3.5" />
                        )}
                    </Button>

                    <Button
                        variant="default"
                        size="sm"
                        asChild
                        className="h-8 gap-1.5 rounded-lg bg-primary px-3 text-xs font-semibold text-primary-foreground shadow-2xs"
                    >
                        <Link href="/menu" prefetch>
                            <LayoutGrid className="size-3.5" />
                            <span>Menu</span>
                        </Link>
                    </Button>
                </div>
            </div>
        </header>
    );
}
