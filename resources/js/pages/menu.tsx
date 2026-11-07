import { Head, Link, usePage } from '@inertiajs/react';
import {
    ArrowLeft,
    Crown,
    Home,
    Landmark,
    LayoutGrid,
    LogOut,
    Megaphone,
    Palette,
    Settings,
    ShieldCheck,
    SlidersHorizontal,
    Sparkles,
    Tag,
    Tv,
    User as UserIcon,
    UserCheck,
    Volume2,
    type LucideIcon,
} from 'lucide-react';
import { MobileBottomNav } from '@/components/mobile-bottom-nav';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useInitials } from '@/hooks/use-initials';
import { cn } from '@/lib/utils';
import { dashboard, logout } from '@/routes';
import type { User } from '@/types';

interface MenuItem {
    title: string;
    href: string;
    icon: LucideIcon;
    gradientClass: string;
    description: string;
}

const menuItems: MenuItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
        icon: LayoutGrid,
        gradientClass: 'bg-linear-to-br from-blue-500 to-indigo-600 shadow-blue-500/25',
        description: 'Event overview & stats',
    },
    {
        title: 'Host Announcer',
        href: '/host',
        icon: Megaphone,
        gradientClass: 'bg-linear-to-br from-purple-500 to-violet-600 shadow-purple-500/25',
        description: 'Stage queuing console',
    },
    {
        title: 'Attendees',
        href: '/attendees',
        icon: UserCheck,
        gradientClass: 'bg-linear-to-br from-emerald-500 to-teal-600 shadow-emerald-500/25',
        description: 'Registry & verification',
    },
    {
        title: 'Categories',
        href: '/categories',
        icon: Tag,
        gradientClass: 'bg-linear-to-br from-amber-500 to-orange-600 shadow-amber-500/25',
        description: 'Guest category manager',
    },
    {
        title: 'Big Screen',
        href: '/display',
        icon: Tv,
        gradientClass: 'bg-linear-to-br from-rose-500 to-red-600 shadow-rose-500/25',
        description: 'Live arrival display',
    },
    {
        title: 'Protocol Order',
        href: '/settings/protocol-priority',
        icon: Crown,
        gradientClass: 'bg-linear-to-br from-yellow-500 to-amber-600 shadow-amber-500/25',
        description: 'Official seniority order',
    },
    {
        title: 'Audio Setup',
        href: '/settings/announcer',
        icon: Volume2,
        gradientClass: 'bg-linear-to-br from-sky-500 to-blue-600 shadow-sky-500/25',
        description: 'Chime & speech settings',
    },
    {
        title: 'Settings',
        href: '/settings',
        icon: SlidersHorizontal,
        gradientClass: 'bg-linear-to-br from-cyan-500 to-teal-600 shadow-cyan-500/25',
        description: 'System configurations',
    },
    {
        title: 'Profile',
        href: '/settings/profile',
        icon: UserIcon,
        gradientClass: 'bg-linear-to-br from-slate-600 to-neutral-700 shadow-slate-500/25',
        description: 'Account information',
    },
    {
        title: 'Security',
        href: '/settings/security',
        icon: ShieldCheck,
        gradientClass: 'bg-linear-to-br from-zinc-600 to-zinc-800 shadow-zinc-500/25',
        description: 'Password & authentication',
    },
    {
        title: 'Appearance',
        href: '/settings/appearance',
        icon: Palette,
        gradientClass: 'bg-linear-to-br from-pink-500 to-rose-600 shadow-pink-500/25',
        description: 'Theme & display mode',
    },
    {
        title: 'Welcome Screen',
        href: '/',
        icon: Sparkles,
        gradientClass: 'bg-linear-to-br from-indigo-500 to-purple-600 shadow-indigo-500/25',
        description: 'Public landing page',
    },
];

export default function MenuPage() {
    const pageProps = usePage().props as { auth?: { user?: User } };
    const user = pageProps.auth?.user;
    const getInitials = useInitials();

    return (
        <div className="min-h-screen bg-neutral-50 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100 flex flex-col pb-24">
            <Head title="Menu - ALAYON 2026" />

            {/* Mobile / Full-Page Header */}
            <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-neutral-200/80 bg-white/95 px-4 backdrop-blur-md dark:border-neutral-800/80 dark:bg-neutral-900/95 sm:px-6">
                <div className="flex items-center gap-3">
                    <Button
                        variant="ghost"
                        size="icon"
                        asChild
                        className="size-9 rounded-xl text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
                    >
                        <Link href={dashboard()} prefetch title="Back to Home">
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
                            <p className="text-xs text-muted-foreground mt-0.5">
                                Tap any module below to open
                            </p>
                        </div>
                        <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">
                            12 Modules
                        </span>
                    </div>
                </div>

                {/* 3-Column Mobile Application Grid */}
                <div className="grid grid-cols-3 gap-3.5 sm:gap-4">
                    {menuItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            prefetch
                            className="group relative flex flex-col items-center justify-center rounded-2xl border border-transparent bg-white/70 p-3 text-center shadow-xs transition-all duration-150 active:scale-95 hover:border-neutral-200 hover:bg-white hover:shadow-sm dark:bg-neutral-900/70 dark:hover:border-neutral-800 dark:hover:bg-neutral-900"
                        >
                            {/* App Icon Squircle */}
                            <div
                                className={cn(
                                    'relative flex size-15 sm:size-16 items-center justify-center rounded-2xl shadow-md transition-transform duration-200 group-hover:scale-105',
                                    item.gradientClass
                                )}
                            >
                                <item.icon className="size-7 sm:size-8 text-white drop-shadow-xs" />
                            </div>

                            {/* Title */}
                            <span className="mt-2 text-xs font-semibold leading-tight text-neutral-800 group-hover:text-primary dark:text-neutral-200 line-clamp-1 max-w-[95px]">
                                {item.title}
                            </span>
                        </Link>
                    ))}
                </div>

                {/* Logged In User Profile & Quick Sign Out Card */}
                {user && (
                    <div className="mt-8 rounded-2xl border border-neutral-200/80 bg-white p-4 shadow-xs dark:border-neutral-800 dark:bg-neutral-900">
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                                <Avatar className="size-10 rounded-xl">
                                    <AvatarImage src={user.avatar} alt={user.name} />
                                    <AvatarFallback className="rounded-xl bg-neutral-200 text-sm font-bold text-neutral-800 dark:bg-neutral-700 dark:text-neutral-200">
                                        {getInitials(user.name)}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="min-w-0 flex-1">
                                    <div className="truncate text-sm font-bold text-neutral-900 dark:text-neutral-100">
                                        {user.name}
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
