import { Head, Link, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import {
    ArrowLeft,
    Crown,
    Download,
    Home,
    Landmark,
    LayoutGrid,
    LogOut,
    Maximize2,
    Megaphone,
    Minimize2,
    Palette,
    Settings,
    Shield,
    ShieldCheck,
    SlidersHorizontal,
    Smartphone,
    Sparkles,
    Tag,
    Tv,
    User as UserIcon,
    UserCheck,
    Users,
    Volume2,
    WifiOff,
    type LucideIcon,
} from 'lucide-react';
import { MobileBottomNav } from '@/components/mobile-bottom-nav';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useInitials } from '@/hooks/use-initials';
import { usePWA } from '@/hooks/use-pwa';
import { cn } from '@/lib/utils';
import { dashboard, logout } from '@/routes';
import type { User, UserRole } from '@/types';

interface MenuItem {
    title: string;
    href: string;
    icon: LucideIcon;
    gradientClass: string;
    description: string;
    roles?: UserRole[];
}

const allMenuItems: MenuItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
        icon: LayoutGrid,
        gradientClass:
            'bg-linear-to-br from-blue-500 to-indigo-600 shadow-blue-500/25',
        description: 'Event overview & stats',
        roles: ['admin', 'host', 'staff'],
    },
    {
        title: 'Host Announcer',
        href: '/host',
        icon: Megaphone,
        gradientClass:
            'bg-linear-to-br from-purple-500 to-violet-600 shadow-purple-500/25',
        description: 'Stage queuing console',
        roles: ['admin', 'host'],
    },
    {
        title: 'Attendees',
        href: '/attendees',
        icon: UserCheck,
        gradientClass:
            'bg-linear-to-br from-emerald-500 to-teal-600 shadow-emerald-500/25',
        description: 'Registry & verification',
        roles: ['admin', 'staff'],
    },
    {
        title: 'Categories',
        href: '/categories',
        icon: Tag,
        gradientClass:
            'bg-linear-to-br from-amber-500 to-orange-600 shadow-amber-500/25',
        description: 'Guest category manager',
        roles: ['admin'],
    },
    {
        title: 'Big Screen',
        href: '/display',
        icon: Tv,
        gradientClass:
            'bg-linear-to-br from-rose-500 to-red-600 shadow-rose-500/25',
        description: 'Live arrival display',
        roles: ['admin', 'host', 'staff'],
    },
    {
        title: 'Protocol Order',
        href: '/settings/protocol-priority',
        icon: Crown,
        gradientClass:
            'bg-linear-to-br from-yellow-500 to-amber-600 shadow-amber-500/25',
        description: 'Official seniority order',
        roles: ['admin'],
    },
    {
        title: 'User Levels',
        href: '/settings/users',
        icon: Users,
        gradientClass:
            'bg-linear-to-br from-violet-600 to-purple-800 shadow-purple-600/25',
        description: 'Role access management',
        roles: ['admin'],
    },
    {
        title: 'Audio Setup',
        href: '/settings/announcer',
        icon: Volume2,
        gradientClass:
            'bg-linear-to-br from-sky-500 to-blue-600 shadow-sky-500/25',
        description: 'Chime & speech settings',
        roles: ['admin', 'host'],
    },
    {
        title: 'Settings',
        href: '/settings',
        icon: SlidersHorizontal,
        gradientClass:
            'bg-linear-to-br from-cyan-500 to-teal-600 shadow-cyan-500/25',
        description: 'System configurations',
        roles: ['admin', 'host', 'staff'],
    },
    {
        title: 'Profile',
        href: '/settings/profile',
        icon: UserIcon,
        gradientClass:
            'bg-linear-to-br from-slate-600 to-neutral-700 shadow-slate-500/25',
        description: 'Account information',
        roles: ['admin', 'host', 'staff'],
    },
    {
        title: 'Security',
        href: '/settings/security',
        icon: ShieldCheck,
        gradientClass:
            'bg-linear-to-br from-zinc-600 to-zinc-800 shadow-zinc-500/25',
        description: 'Password & authentication',
        roles: ['admin', 'host', 'staff'],
    },
    {
        title: 'Appearance',
        href: '/settings/appearance',
        icon: Palette,
        gradientClass:
            'bg-linear-to-br from-pink-500 to-rose-600 shadow-pink-500/25',
        description: 'Theme & display mode',
        roles: ['admin', 'host', 'staff'],
    },
    {
        title: 'Welcome Screen',
        href: '/',
        icon: Sparkles,
        gradientClass:
            'bg-linear-to-br from-indigo-500 to-purple-600 shadow-indigo-500/25',
        description: 'Public landing page',
        roles: ['admin', 'host', 'staff'],
    },
];

export default function MenuPage() {
    const pageProps = usePage().props as { auth?: { user?: User } };
    const user = pageProps.auth?.user;
    const role: UserRole = user?.role || 'staff';
    const getInitials = useInitials();
    const [isFullscreen, setIsFullscreen] = useState(false);
    const { canInstall, isStandalone, isOnline, promptInstall } = usePWA();

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

        if (window.pageYOffset === 0) {
            window.scrollTo(0, 1);
        }
    };

    const menuItems = allMenuItems.filter(
        (item) => !item.roles || item.roles.includes(role),
    );

    const getRoleBadge = (r: string) => {
        switch (r) {
            case 'admin':
                return (
                    <Badge className="gap-1 bg-purple-600 px-2 py-0.5 text-[10px] font-bold text-white">
                        <Crown className="size-2.5" /> Admin
                    </Badge>
                );
            case 'host':
                return (
                    <Badge className="gap-1 bg-sky-600 px-2 py-0.5 text-[10px] font-bold text-white">
                        <Megaphone className="size-2.5" /> Host
                    </Badge>
                );
            case 'staff':
            default:
                return (
                    <Badge className="gap-1 bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white">
                        <UserCheck className="size-2.5" /> Staff
                    </Badge>
                );
        }
    };

    return (
        <div className="flex min-h-screen flex-col bg-neutral-50 pb-24 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">
            <Head title="Menu - ALAYON 2026" />

            {/* Mobile / Full-Page Header */}
            <header className="sticky top-0 z-30 flex shrink-0 flex-col justify-end border-b border-neutral-200/80 bg-white/95 pt-[max(0.75rem,env(safe-area-inset-top,0.75rem))] backdrop-blur-md dark:border-neutral-800/80 dark:bg-neutral-900/95">
                <div className="flex h-14 w-full items-center justify-between px-4 sm:px-6">
                    <div className="flex items-center gap-3">
                        <Button
                            variant="ghost"
                            size="icon"
                            asChild
                            className="size-9 rounded-xl text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
                        >
                            <Link
                                href={dashboard()}
                                prefetch
                                title="Back to Home"
                            >
                                <ArrowLeft className="size-5" />
                            </Link>
                        </Button>
                        <div className="flex items-center gap-2.5">
                            <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
                                <Landmark className="size-5" />
                            </div>
                            <div>
                                <div className="text-xs font-black tracking-widest text-primary uppercase">
                                    ALAYON 2026
                                </div>
                                <div className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-400">
                                    Application Menu
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="icon"
                            type="button"
                            onClick={toggleMobileFullscreen}
                            className="size-8 rounded-lg border-neutral-200 text-neutral-600 dark:border-neutral-800 dark:text-neutral-400"
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
                            variant="outline"
                            size="sm"
                            asChild
                            className="h-8 gap-1.5 rounded-lg border-neutral-200 px-3 text-xs font-semibold shadow-2xs dark:border-neutral-800"
                        >
                            <Link href={dashboard()} prefetch>
                                <Home className="size-3.5 text-primary" />
                                <span>Home</span>
                            </Link>
                        </Button>
                    </div>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="mx-auto w-full max-w-xl flex-1 px-4 py-6 sm:px-6">
                {/* Greeting & Header Badge */}
                <div className="mb-6 rounded-2xl border border-neutral-200/80 bg-linear-to-r from-white to-neutral-100/60 p-4 shadow-xs dark:border-neutral-800 dark:from-neutral-900 dark:to-neutral-900/60">
                    <div className="flex items-center justify-between">
                        <div>
                            <span className="text-[11px] font-bold tracking-wider text-primary uppercase">
                                Navigation Hub
                            </span>
                            <h1 className="mt-0.5 text-lg font-black tracking-tight sm:text-xl">
                                System Applications
                            </h1>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                                Tap any module below to open
                            </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                            {user && getRoleBadge(user.role)}
                            {isStandalone && (
                                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                                    <Smartphone className="size-2.5" /> App Mode
                                </span>
                            )}
                            {!isOnline && (
                                <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                                    <WifiOff className="size-2.5" /> Offline
                                </span>
                            )}
                            <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">
                                {menuItems.length} Modules
                            </span>
                        </div>
                    </div>
                </div>

                {/* Progressive Web App (PWA) Install Prompt Banner */}
                {canInstall && (
                    <div className="mb-4 flex items-center justify-between gap-3 rounded-2xl border border-emerald-500/30 bg-linear-to-r from-emerald-500/10 via-teal-500/5 to-transparent p-3.5 shadow-xs">
                        <div className="flex min-w-0 items-center gap-3">
                            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs">
                                <Download className="size-5" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-900 dark:text-neutral-100">
                                    <span>Install ALAYON App</span>
                                    <Badge
                                        variant="outline"
                                        className="border-emerald-500/30 px-1.5 py-0 text-[10px] font-bold text-emerald-600 dark:text-emerald-400"
                                    >
                                        PWA
                                    </Badge>
                                </div>
                                <div className="truncate text-[11px] text-muted-foreground">
                                    Offline support & fullscreen standalone mode
                                </div>
                            </div>
                        </div>
                        <Button
                            size="sm"
                            onClick={() => void promptInstall()}
                            className="h-8 shrink-0 rounded-xl bg-emerald-600 px-3 text-xs font-bold text-white shadow-xs hover:bg-emerald-700"
                        >
                            Install
                        </Button>
                    </div>
                )}

                {/* 3-Column Mobile Application Grid */}
                <div className="grid grid-cols-3 gap-3.5 sm:gap-4">
                    {menuItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            prefetch
                            className="group relative flex flex-col items-center justify-center rounded-2xl border border-transparent bg-white/70 p-3 text-center shadow-xs transition-all duration-150 hover:border-neutral-200 hover:bg-white hover:shadow-sm active:scale-95 dark:bg-neutral-900/70 dark:hover:border-neutral-800 dark:hover:bg-neutral-900"
                        >
                            {/* App Icon Squircle */}
                            <div
                                className={cn(
                                    'relative flex size-15 items-center justify-center rounded-2xl shadow-md transition-transform duration-200 group-hover:scale-105 sm:size-16',
                                    item.gradientClass,
                                )}
                            >
                                <item.icon className="size-7 text-white drop-shadow-xs sm:size-8" />
                            </div>

                            {/* Title */}
                            <span className="mt-2 line-clamp-1 max-w-[95px] text-xs leading-tight font-semibold text-neutral-800 group-hover:text-primary dark:text-neutral-200">
                                {item.title}
                            </span>
                        </Link>
                    ))}
                </div>

                {/* Logged In User Profile & Quick Sign Out Card */}
                {user && (
                    <div className="mt-8 rounded-2xl border border-neutral-200/80 bg-white p-4 shadow-xs dark:border-neutral-800 dark:bg-neutral-900">
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex min-w-0 items-center gap-3">
                                <Avatar className="size-10 rounded-xl">
                                    <AvatarImage
                                        src={user.avatar}
                                        alt={user.name}
                                    />
                                    <AvatarFallback className="rounded-xl bg-neutral-200 text-sm font-bold text-neutral-800 dark:bg-neutral-700 dark:text-neutral-200">
                                        {getInitials(user.name)}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-1.5 truncate text-sm font-bold text-neutral-900 dark:text-neutral-100">
                                        <span>{user.name}</span>
                                        {getRoleBadge(user.role)}
                                    </div>
                                    <div className="truncate text-xs text-muted-foreground">
                                        {user.email}
                                    </div>
                                </div>
                            </div>

                            <Button
                                variant="outline"
                                size="sm"
                                asChild
                                className="h-9 gap-1.5 rounded-xl border-red-200 text-xs font-semibold text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-950/40"
                            >
                                <Link
                                    href={logout()}
                                    method="post"
                                    as="button"
                                    title="Sign out of account"
                                >
                                    <LogOut className="size-3.5" />
                                    <span>Sign out</span>
                                </Link>
                            </Button>
                        </div>
                    </div>
                )}
            </main>

            {/* Mobile Bottom Navigation Dock */}
            <MobileBottomNav />
        </div>
    );
}
