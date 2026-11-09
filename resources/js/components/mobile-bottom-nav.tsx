import { Link, usePage } from '@inertiajs/react';
import { Home, LayoutGrid, Megaphone, Settings, Tag, Tv, Users } from 'lucide-react';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { cn } from '@/lib/utils';
import { dashboard } from '@/routes';
import type { User } from '@/types';

/**
 * Mobile Bottom Navigation Dock
 *
 * Appears exclusively on mobile view (md:hidden) to ensure all pages
 * have instant, persistent 1-tap links back to Home, Menu, and key modules.
 */
export function MobileBottomNav() {
    const { isCurrentUrl, isCurrentOrParentUrl } = useCurrentUrl();
    const { auth } = usePage().props as { auth?: { user?: User } };
    const role = auth?.user?.role || 'staff';

    return (
        <nav
            aria-label="Mobile Navigation"
            className="fixed bottom-0 inset-x-0 z-40 flex h-16 items-center justify-around border-t border-border/70 bg-background/95 backdrop-blur-md px-2 shadow-lg md:hidden safe-area-pb"
        >
            {/* 1. Home Link (All) */}
            <Link
                href={dashboard()}
                prefetch
                className={cn(
                    'flex flex-1 flex-col items-center justify-center gap-0.5 py-1 text-center transition-colors',
                    isCurrentUrl(dashboard())
                        ? 'text-primary font-bold'
                        : 'text-muted-foreground hover:text-foreground'
                )}
            >
                <Home className="size-5" />
                <span className="text-[10px] tracking-tight">Home</span>
            </Link>

            {/* 2. Primary Role Action */}
            {role === 'host' ? (
                <Link
                    href="/host"
                    prefetch
                    className={cn(
                        'flex flex-1 flex-col items-center justify-center gap-0.5 py-1 text-center transition-colors',
                        isCurrentOrParentUrl('/host')
                            ? 'text-primary font-bold'
                            : 'text-muted-foreground hover:text-foreground'
                    )}
                >
                    <Megaphone className="size-5" />
                    <span className="text-[10px] tracking-tight">Host</span>
                </Link>
            ) : role === 'admin' ? (
                <Link
                    href="/categories"
                    prefetch
                    className={cn(
                        'flex flex-1 flex-col items-center justify-center gap-0.5 py-1 text-center transition-colors',
                        isCurrentOrParentUrl('/categories')
                            ? 'text-primary font-bold'
                            : 'text-muted-foreground hover:text-foreground'
                    )}
                >
                    <Tag className="size-5" />
                    <span className="text-[10px] tracking-tight">Categories</span>
                </Link>
            ) : (
                <Link
                    href="/attendees"
                    prefetch
                    className={cn(
                        'flex flex-1 flex-col items-center justify-center gap-0.5 py-1 text-center transition-colors',
                        isCurrentUrl('/attendees')
                            ? 'text-primary font-bold'
                            : 'text-muted-foreground hover:text-foreground'
                    )}
                >
                    <Users className="size-5" />
                    <span className="text-[10px] tracking-tight">Attendees</span>
                </Link>
            )}

            {/* 3. Center Menu Launcher (Navigates to dedicated Menu Page) */}
            <Link
                href="/menu"
                prefetch
                className="relative -top-2 flex flex-1 flex-col items-center justify-center"
                aria-label="Open Mobile Application Menu"
            >
                <div
                    className={cn(
                        'flex size-11 items-center justify-center rounded-2xl shadow-md transition-all active:scale-95',
                        isCurrentUrl('/menu')
                            ? 'bg-primary text-primary-foreground shadow-primary/35 ring-2 ring-primary ring-offset-2 ring-offset-background'
                            : 'bg-linear-to-tr from-primary to-primary/85 text-primary-foreground shadow-primary/20'
                    )}
                >
                    <LayoutGrid className="size-5" />
                </div>
                <span
                    className={cn(
                        'mt-0.5 text-[10px] tracking-tight',
                        isCurrentUrl('/menu')
                            ? 'font-bold text-primary'
                            : 'font-semibold text-primary/90'
                    )}
                >
                    Menu
                </span>
            </Link>

            {/* 4. Secondary Action */}
            {role === 'host' ? (
                <Link
                    href="/display"
                    prefetch
                    className={cn(
                        'flex flex-1 flex-col items-center justify-center gap-0.5 py-1 text-center transition-colors',
                        isCurrentUrl('/display')
                            ? 'text-primary font-bold'
                            : 'text-muted-foreground hover:text-foreground'
                    )}
                >
                    <Tv className="size-5" />
                    <span className="text-[10px] tracking-tight">Display</span>
                </Link>
            ) : role === 'admin' ? (
                <Link
                    href="/attendees"
                    prefetch
                    className={cn(
                        'flex flex-1 flex-col items-center justify-center gap-0.5 py-1 text-center transition-colors',
                        isCurrentUrl('/attendees')
                            ? 'text-primary font-bold'
                            : 'text-muted-foreground hover:text-foreground'
                    )}
                >
                    <Users className="size-5" />
                    <span className="text-[10px] tracking-tight">Attendees</span>
                </Link>
            ) : (
                <Link
                    href="/display"
                    prefetch
                    className={cn(
                        'flex flex-1 flex-col items-center justify-center gap-0.5 py-1 text-center transition-colors',
                        isCurrentUrl('/display')
                            ? 'text-primary font-bold'
                            : 'text-muted-foreground hover:text-foreground'
                    )}
                >
                    <Tv className="size-5" />
                    <span className="text-[10px] tracking-tight">Display</span>
                </Link>
            )}

            {/* 5. Settings Link (All) */}
            <Link
                href="/settings"
                prefetch
                className={cn(
                    'flex flex-1 flex-col items-center justify-center gap-0.5 py-1 text-center transition-colors',
                    isCurrentOrParentUrl('/settings')
                        ? 'text-primary font-bold'
                        : 'text-muted-foreground hover:text-foreground'
                )}
            >
                <Settings className="size-5" />
                <span className="text-[10px] tracking-tight">Settings</span>
            </Link>
        </nav>
    );
}
