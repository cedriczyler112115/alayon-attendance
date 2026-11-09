import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
    readonly platforms: string[];
    readonly userChoice: Promise<{
        outcome: 'accepted' | 'dismissed';
        platform: string;
    }>;
    prompt(): Promise<void>;
}

export function usePWA() {
    const [installPrompt, setInstallPrompt] =
        useState<BeforeInstallPromptEvent | null>(null);
    const [isStandalone, setIsStandalone] = useState(false);
    const [isOnline, setIsOnline] = useState(
        typeof navigator !== 'undefined' ? navigator.onLine : true,
    );

    useEffect(() => {
        // Check standalone display mode (installed PWA)
        const checkStandalone = () => {
            const isWindowStandalone = window.matchMedia(
                '(display-mode: standalone)',
            ).matches;
            const isNavigatorStandalone =
                (navigator as unknown as { standalone?: boolean })
                    .standalone === true;
            setIsStandalone(isWindowStandalone || isNavigatorStandalone);
        };

        checkStandalone();

        // Listen for install prompt from browser
        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            setInstallPrompt(e as BeforeInstallPromptEvent);
        };

        const handleAppInstalled = () => {
            setInstallPrompt(null);
            setIsStandalone(true);
            console.log('[PWA] ALAYON was successfully installed.');
        };

        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener(
            'beforeinstallprompt',
            handleBeforeInstallPrompt,
        );
        window.addEventListener('appinstalled', handleAppInstalled);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener(
                'beforeinstallprompt',
                handleBeforeInstallPrompt,
            );
            window.removeEventListener('appinstalled', handleAppInstalled);
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    const promptInstall = async () => {
        if (!installPrompt) {
            return false;
        }

        await installPrompt.prompt();
        const choice = await installPrompt.userChoice;
        if (choice.outcome === 'accepted') {
            setInstallPrompt(null);
            return true;
        }

        return false;
    };

    return {
        canInstall: !!installPrompt,
        isStandalone,
        isOnline,
        promptInstall,
    };
}
