import { createInertiaApp } from '@inertiajs/react';
import { registerSW } from 'virtual:pwa-register';
import { MobileGlobalLoader } from '@/components/mobile-global-loader';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { initializeTheme } from '@/hooks/use-appearance';
import AppLayout from '@/layouts/app-layout';
import AuthLayout from '@/layouts/auth-layout';
import SettingsLayout from '@/layouts/settings/layout';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

void createInertiaApp({
    title: (title) => (title ? `${title} - ${appName}` : appName),
    layout: (name) => {
        switch (true) {
            case name === 'welcome':
            case name === 'host/display':
            case name === 'attendance/register':
            case name === 'menu':
                return null;
            case name.startsWith('auth/'):
                return AuthLayout;
            case name.startsWith('settings/'):
                return [AppLayout, SettingsLayout];
            default:
                return AppLayout;
        }
    },
    strictMode: true,
    withApp(app) {
        return (
            <TooltipProvider delayDuration={0}>
                {app}
                <Toaster />
                <MobileGlobalLoader />
            </TooltipProvider>
        );
    },
    progress: {
        color: '#4B5563',
    },
});

// This will set light / dark mode on load...
initializeTheme();

// Register Progressive Web App (PWA) Service Worker with automatic updates in secure contexts
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    const isSecure =
        window.isSecureContext ||
        window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1';

    if (isSecure) {
        registerSW({
            immediate: true,
            onNeedRefresh() {
                console.log(
                    '[PWA] New version detected; ready for next navigation.',
                );
            },
            onOfflineReady() {
                console.log('[PWA] ALAYON is ready for offline operation.');
            },
            onRegisterError(error) {
                console.warn(
                    '[PWA] Service Worker registration encountered an issue:',
                    error,
                );
            },
        });
    }
}
