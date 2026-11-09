import { Head, Link, usePage } from '@inertiajs/react';
import {
    ArrowRight,
    Award,
    Calendar,
    Check,
    CheckCircle2,
    Clock,
    Crown,
    ExternalLink,
    Flame,
    Landmark,
    LayoutGrid,
    MapPin,
    Megaphone,
    Moon,
    Printer,
    Radio,
    Shield,
    ShieldCheck,
    SlidersHorizontal,
    Sparkles,
    Sun,
    Tag,
    Tv,
    UserCheck,
    Users,
    Volume2,
    Zap,
} from 'lucide-react';
import { useState } from 'react';
import AppLogoIcon from '@/components/app-logo-icon';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAppearance } from '@/hooks/use-appearance';
import { playAnnouncementChime } from '@/lib/host-announcer-utils';
import { cn } from '@/lib/utils';
import { dashboard, login, register } from '@/routes';
import type { User } from '@/types';

interface ActiveEvent {
    id: number;
    title: string;
    theme?: string;
    venue?: string;
    event_date: string;
    status: string;
}

interface Stats {
    total_registered: number;
    total_announced: number;
    categories_count: number;
}

interface Props {
    activeEvent?: ActiveEvent | null;
    stats?: Stats;
}

export default function Welcome({ activeEvent, stats }: Props) {
    const { auth } = usePage().props as { auth: { user?: User | null } };
    const user = auth?.user;
    const { resolvedAppearance, updateAppearance } = useAppearance();
    const [isPlayingChime, setIsPlayingChime] = useState(false);

    const toggleTheme = () => {
        updateAppearance(resolvedAppearance === 'dark' ? 'light' : 'dark');
    };

    const handleTestChime = () => {
        setIsPlayingChime(true);
        playAnnouncementChime();
        setTimeout(() => setIsPlayingChime(false), 1200);
    };

    // Determine user's primary landing destination based on role
    const getPrimaryAction = () => {
        if (!user) {
            return {
                title: 'Sign In to Console',
                href: login(),
                icon: ShieldCheck,
            };
        }

        if (user.role === 'host') {
            return {
                title: 'Open Host Announcer',
                href: '/host',
                icon: Megaphone,
            };
        }

        if (user.role === 'staff') {
            return {
                title: 'Open Attendance Registry',
                href: '/attendees',
                icon: UserCheck,
            };
        }

        return {
            title: 'Enter Executive Dashboard',
            href: dashboard(),
            icon: LayoutGrid,
        };
    };

    const primaryAction = getPrimaryAction();

    return (
        <div className="min-h-screen bg-neutral-50 text-neutral-900 selection:bg-emerald-500 selection:text-white dark:bg-neutral-950 dark:text-neutral-100 flex flex-col font-sans transition-colors duration-300">
            <Head title="ALAYON 2026 - Dignitary Attendance, Protocol & Stage Announcer" />

            {/* Top Navigation Bar */}
            <header className="sticky top-0 z-50 w-full border-b border-neutral-200/80 bg-white/80 backdrop-blur-md dark:border-neutral-800/80 dark:bg-neutral-900/80 pt-[max(0.75rem,env(safe-area-inset-top,0.75rem))] sm:pt-0">
                <div className="mx-auto flex h-14 sm:h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                    {/* Brand / Emblem */}
                    <Link href="/" className="flex items-center gap-3 group">
                        <div className="flex size-10 items-center justify-center rounded-xl bg-linear-to-tr from-emerald-600 via-teal-600 to-indigo-600 text-white shadow-md shadow-emerald-500/20 transition-transform group-hover:scale-105">
                            <Landmark className="size-5" />
                        </div>
                        <div className="flex flex-col text-left">
                            <span className="text-sm font-black tracking-widest text-emerald-700 dark:text-emerald-400 uppercase">
                                ALAYON 2026
                            </span>
                            <span className="text-[10px] font-medium text-muted-foreground tracking-tight">
                                Attendance & Protocol Management
                            </span>
                        </div>
                    </Link>

                    {/* Navigation Actions */}
                    <div className="flex items-center gap-2 sm:gap-3">
                        {/* Live Big Screen Link */}
                        <Button
                            variant="outline"
                            size="sm"
                            asChild
                            className="hidden sm:inline-flex h-9 gap-2 rounded-xl border-neutral-200 dark:border-neutral-800 text-xs font-semibold shadow-2xs hover:border-emerald-500/40"
                        >
                            <Link href="/display" target="_blank">
                                <span className="relative flex size-2">
                                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex size-2 rounded-full bg-emerald-500"></span>
                                </span>
                                <Tv className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                                <span>Big Screen Display</span>
                            </Link>
                        </Button>

                        {/* Mobile Menu Shortcut */}
                        <Button
                            variant="ghost"
                            size="sm"
                            asChild
                            className="hidden md:inline-flex h-9 gap-1.5 rounded-xl text-xs font-medium text-muted-foreground hover:text-foreground"
                        >
                            <Link href="/menu">
                                <LayoutGrid className="size-4" />
                                <span>Menu Hub</span>
                            </Link>
                        </Button>

                        {/* Theme Toggle Button */}
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={toggleTheme}
                            className="size-9 rounded-xl text-muted-foreground hover:text-foreground"
                            title="Toggle Light / Dark theme"
                        >
                            {resolvedAppearance === 'dark' ? (
                                <Sun className="size-4 text-amber-400" />
                            ) : (
                                <Moon className="size-4 text-slate-700" />
                            )}
                        </Button>

                        {/* Auth Buttons */}
                        {user ? (
                            <div className="flex items-center gap-2">
                                <Button
                                    size="sm"
                                    asChild
                                    className="h-9 gap-1.5 rounded-xl bg-linear-to-r from-emerald-600 to-teal-600 text-xs font-semibold text-white shadow-sm hover:from-emerald-700 hover:to-teal-700"
                                >
                                    <Link href={primaryAction.href} prefetch>
                                        <primaryAction.icon className="size-3.5" />
                                        <span>{primaryAction.title}</span>
                                    </Link>
                                </Button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-1.5 sm:gap-2">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    asChild
                                    className="h-9 text-xs font-semibold"
                                >
                                    <Link href={login()}>Log in</Link>
                                </Button>
                                <Button
                                    size="sm"
                                    asChild
                                    className="h-9 rounded-xl bg-primary px-3 sm:px-4 text-xs font-semibold shadow-xs hover:bg-primary/90"
                                >
                                    <Link href={register()}>Register</Link>
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {/* Main Hero Section */}
            <main className="flex-1">
                {/* Hero Banner */}
                <section className="relative overflow-hidden pt-12 pb-16 lg:pt-20 lg:pb-24 border-b border-neutral-200/80 dark:border-neutral-800/80">
                    {/* Background Radial Glow */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none w-[600px] h-[380px] bg-gradient-to-tr from-emerald-500/10 via-teal-500/10 to-indigo-500/10 blur-3xl rounded-full" />

                    <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
                        {/* Assembly Badge Pill */}
                        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1 text-xs font-semibold text-emerald-800 dark:text-emerald-300 shadow-xs mb-6 backdrop-blur-xs">
                            <span className="relative flex size-2">
                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex size-2 rounded-full bg-emerald-500"></span>
                            </span>
                            <span>Republic of the Philippines • Official Assembly Protocol</span>
                        </div>

                        {/* Main Title Heading */}
                        <h1 className="text-3xl font-black tracking-tight sm:text-5xl lg:text-6xl text-neutral-900 dark:text-white max-w-4xl mx-auto leading-tight">
                            ALAYON ATTENDANCE
                            <span className="block mt-1 text-transparent bg-clip-text bg-linear-to-r from-emerald-600 via-teal-600 to-indigo-600 dark:from-emerald-400 dark:via-teal-300 dark:to-indigo-400 font-extrabold text-2xl sm:text-4xl lg:text-5xl">
                                Protocol, Seniority & Stage Announcer Platform
                            </span>
                        </h1>

                        {/* Active Assembly Theme & Description */}
                        <p className="mt-4 text-base sm:text-lg font-medium text-emerald-800 dark:text-emerald-300/90 italic max-w-3xl mx-auto">
                            “{activeEvent?.theme || 'Strengthening Collaborative Partnerships for Inclusive Community Resilience'}”
                        </p>

                        <p className="mt-3 text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                            The unified digital management suite for Philippine provincial assemblies, LGU leaders summits, and stakeholder conventions. Uniting fast registration desks, official seniority protocols, and broadcast stage announcements.
                        </p>

                        {/* Hero CTA Action Group */}
                        <div className="mt-8 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
                            <Button
                                size="lg"
                                asChild
                                className="h-12 px-6 rounded-2xl bg-linear-to-r from-emerald-600 via-teal-600 to-indigo-600 text-sm font-bold text-white shadow-lg shadow-emerald-500/25 hover:from-emerald-700 hover:to-indigo-700 hover:scale-[1.02] active:scale-[0.98] transition-all"
                            >
                                <Link href={primaryAction.href} prefetch>
                                    <primaryAction.icon className="size-4.5 mr-2" />
                                    <span>{primaryAction.title}</span>
                                    <ArrowRight className="size-4 ml-1.5" />
                                </Link>
                            </Button>

                            <Button
                                variant="outline"
                                size="lg"
                                asChild
                                className="h-12 px-6 rounded-2xl border-neutral-300 dark:border-neutral-700 bg-white/70 dark:bg-neutral-900/70 text-sm font-bold shadow-xs hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all"
                            >
                                <Link href="/display" target="_blank">
                                    <Tv className="size-4.5 mr-2 text-emerald-600 dark:text-emerald-400" />
                                    <span>Live Big Screen</span>
                                    <ExternalLink className="size-3.5 ml-1.5 opacity-60" />
                                </Link>
                            </Button>

                            {/* Broadcast Chime Test Trigger */}
                            <Button
                                variant="ghost"
                                size="lg"
                                onClick={handleTestChime}
                                className={cn(
                                    'h-12 px-5 rounded-2xl text-xs font-semibold text-muted-foreground hover:text-foreground transition-all gap-2',
                                    isPlayingChime && 'text-emerald-600 font-bold bg-emerald-50 dark:bg-emerald-950/40'
                                )}
                            >
                                <Volume2 className={cn('size-4 text-emerald-600', isPlayingChime && 'animate-bounce')} />
                                <span>{isPlayingChime ? 'Chiming...' : 'Preview Stage Chime'}</span>
                            </Button>
                        </div>

                        {/* Live Assembly Real-Time Stats Grid */}
                        <div className="mt-12 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 max-w-5xl mx-auto text-left">
                            {/* Stat 1: Registered Guests */}
                            <div className="rounded-2xl border border-neutral-200/80 bg-white/80 p-4 shadow-xs backdrop-blur-xs dark:border-neutral-800 dark:bg-neutral-900/80">
                                <div className="flex items-center justify-between">
                                    <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                                        Registered Guests
                                    </span>
                                    <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                        <Users className="size-4" />
                                    </div>
                                </div>
                                <div className="mt-2 text-2xl sm:text-3xl font-black text-neutral-900 dark:text-white">
                                    {stats?.total_registered ?? 0}
                                </div>
                                <div className="mt-1 text-[11px] text-muted-foreground flex items-center gap-1">
                                    <CheckCircle2 className="size-3 text-emerald-500" />
                                    <span>Verified on-site & invited</span>
                                </div>
                            </div>

                            {/* Stat 2: Announced on Stage */}
                            <div className="rounded-2xl border border-neutral-200/80 bg-white/80 p-4 shadow-xs backdrop-blur-xs dark:border-neutral-800 dark:bg-neutral-900/80">
                                <div className="flex items-center justify-between">
                                    <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                                        Called to Stage
                                    </span>
                                    <div className="flex size-7 items-center justify-center rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400">
                                        <Megaphone className="size-4" />
                                    </div>
                                </div>
                                <div className="mt-2 text-2xl sm:text-3xl font-black text-neutral-900 dark:text-white">
                                    {stats?.total_announced ?? 0}
                                </div>
                                <div className="mt-1 text-[11px] text-muted-foreground flex items-center gap-1">
                                    <Radio className="size-3 text-sky-500" />
                                    <span>Announced dignitaries</span>
                                </div>
                            </div>

                            {/* Stat 3: Guest Categories */}
                            <div className="rounded-2xl border border-neutral-200/80 bg-white/80 p-4 shadow-xs backdrop-blur-xs dark:border-neutral-800 dark:bg-neutral-900/80">
                                <div className="flex items-center justify-between">
                                    <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                                        Protocol Tiers
                                    </span>
                                    <div className="flex size-7 items-center justify-center rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
                                        <Crown className="size-4" />
                                    </div>
                                </div>
                                <div className="mt-2 text-2xl sm:text-3xl font-black text-neutral-900 dark:text-white">
                                    {stats?.categories_count ?? 4}
                                </div>
                                <div className="mt-1 text-[11px] text-muted-foreground flex items-center gap-1">
                                    <Tag className="size-3 text-purple-500" />
                                    <span>Governors, Mayors, PSWDO, CSWDO</span>
                                </div>
                            </div>

                            {/* Stat 4: Event Status */}
                            <div className="rounded-2xl border border-neutral-200/80 bg-white/80 p-4 shadow-xs backdrop-blur-xs dark:border-neutral-800 dark:bg-neutral-900/80">
                                <div className="flex items-center justify-between">
                                    <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                                        Assembly Session
                                    </span>
                                    <div className="flex size-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                                        <Flame className="size-4" />
                                    </div>
                                </div>
                                <div className="mt-2 text-lg sm:text-xl font-black text-emerald-600 dark:text-emerald-400 truncate">
                                    {activeEvent?.status ? activeEvent.status.toUpperCase() : 'ACTIVE'}
                                </div>
                                <div className="mt-1 text-[11px] text-muted-foreground truncate">
                                    {activeEvent?.event_date || 'Current Session'}
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Section 2: Four Core Pillars Showcase */}
                <section className="py-16 sm:py-20 lg:py-24 bg-neutral-100/50 dark:bg-neutral-900/30">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="text-center max-w-3xl mx-auto">
                            <span className="text-xs font-bold tracking-widest uppercase text-emerald-600 dark:text-emerald-400">
                                Architecture & Capabilities
                            </span>
                            <h2 className="mt-2 text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight">
                                Built for High-Precedence Governmental Assemblies
                            </h2>
                            <p className="mt-3 text-sm sm:text-base text-muted-foreground">
                                Every component of ALAYON is specifically tailored to streamline registration, honor official hierarchy, and provide smooth presentation flow.
                            </p>
                        </div>

                        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {/* Feature 1: Attendance Registry */}
                            <Card className="rounded-2xl border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-xs hover:shadow-md transition-shadow">
                                <CardHeader className="p-6 pb-4">
                                    <div className="flex size-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mb-3">
                                        <UserCheck className="size-6" />
                                    </div>
                                    <CardTitle className="text-base font-bold">
                                        1. Attendance Registry
                                    </CardTitle>
                                    <CardDescription className="text-xs leading-relaxed mt-1">
                                        Rapid reception desk verification with province, city, and jurisdiction rules.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="p-6 pt-0 space-y-2 text-xs text-muted-foreground">
                                    <div className="flex items-start gap-2">
                                        <Check className="size-3.5 text-emerald-500 shrink-0 mt-0.5" />
                                        <span>Handles Governors, Mayors, Directors & authorized representatives</span>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <Check className="size-3.5 text-emerald-500 shrink-0 mt-0.5" />
                                        <span>Multi-select category filters with customizable printable sheets</span>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <Check className="size-3.5 text-emerald-500 shrink-0 mt-0.5" />
                                        <span>Real-time presence tracking without page refreshes</span>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Feature 2: Stage Announcer Console */}
                            <Card className="rounded-2xl border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-xs hover:shadow-md transition-shadow">
                                <CardHeader className="p-6 pb-4">
                                    <div className="flex size-12 items-center justify-center rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 mb-3">
                                        <Megaphone className="size-6" />
                                    </div>
                                    <CardTitle className="text-base font-bold">
                                        2. Host Announcer
                                    </CardTitle>
                                    <CardDescription className="text-xs leading-relaxed mt-1">
                                        Dedicated emcee console with live audio chimes and speech synthesis.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="p-6 pt-0 space-y-2 text-xs text-muted-foreground">
                                    <div className="flex items-start gap-2">
                                        <Check className="size-3.5 text-sky-500 shrink-0 mt-0.5" />
                                        <span>Instant stage call with automated broadcast chime synthesizers</span>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <Check className="size-3.5 text-sky-500 shrink-0 mt-0.5" />
                                        <span>Web Speech TTS announces dignitary names and honorifics</span>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <Check className="size-3.5 text-sky-500 shrink-0 mt-0.5" />
                                        <span>Live polling keeps emcee updated as new guests check in</span>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Feature 3: Big Screen Display */}
                            <Card className="rounded-2xl border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-xs hover:shadow-md transition-shadow">
                                <CardHeader className="p-6 pb-4">
                                    <div className="flex size-12 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 mb-3">
                                        <Tv className="size-6" />
                                    </div>
                                    <CardTitle className="text-base font-bold">
                                        3. 4K Big Screen Projector
                                    </CardTitle>
                                    <CardDescription className="text-xs leading-relaxed mt-1">
                                        High-contrast public projector mode designed for convention LED walls.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="p-6 pt-0 space-y-2 text-xs text-muted-foreground">
                                    <div className="flex items-start gap-2">
                                        <Check className="size-3.5 text-purple-500 shrink-0 mt-0.5" />
                                        <span>Full-screen arrival banner visible from across large halls</span>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <Check className="size-3.5 text-purple-500 shrink-0 mt-0.5" />
                                        <span>Automatic rotating queue of recently announced VIPs</span>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <Check className="size-3.5 text-purple-500 shrink-0 mt-0.5" />
                                        <span>Optimized for standalone operation with zero operator overhead</span>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Feature 4: Role-Based User Levels */}
                            <Card className="rounded-2xl border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-xs hover:shadow-md transition-shadow">
                                <CardHeader className="p-6 pb-4">
                                    <div className="flex size-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 mb-3">
                                        <Shield className="size-6" />
                                    </div>
                                    <CardTitle className="text-base font-bold">
                                        4. 3-Tier User Levels
                                    </CardTitle>
                                    <CardDescription className="text-xs leading-relaxed mt-1">
                                        Strict role-based access control protecting operational boundaries.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="p-6 pt-0 space-y-2 text-xs text-muted-foreground">
                                    <div className="flex items-start gap-2">
                                        <Check className="size-3.5 text-amber-500 shrink-0 mt-0.5" />
                                        <span><strong>Host:</strong> Restricted to Dashboard & Host Announcer</span>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <Check className="size-3.5 text-amber-500 shrink-0 mt-0.5" />
                                        <span><strong>Staff:</strong> Restricted to Attendance Registry & Dashboard</span>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <Check className="size-3.5 text-amber-500 shrink-0 mt-0.5" />
                                        <span><strong>Admin:</strong> Full system access, protocol order & users</span>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </section>

                {/* Section 3: Active Assembly Spotlight & Venue Details */}
                {activeEvent && (
                    <section className="py-16 sm:py-20 border-b border-neutral-200/80 dark:border-neutral-800/80">
                        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
                            <div className="rounded-3xl border border-emerald-500/20 bg-linear-to-br from-emerald-500/5 via-teal-500/5 to-transparent p-6 sm:p-10 dark:border-emerald-500/10 dark:from-emerald-950/20 dark:via-teal-950/20">
                                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                                    <div className="space-y-3">
                                        <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                                            <Calendar className="size-3.5" />
                                            <span>Active Assembly Session</span>
                                        </div>
                                        <h3 className="text-xl sm:text-2xl font-black text-neutral-900 dark:text-white">
                                            {activeEvent.title}
                                        </h3>
                                        {activeEvent.theme && (
                                            <p className="text-xs sm:text-sm font-medium text-emerald-700 dark:text-emerald-300 italic">
                                                “{activeEvent.theme}”
                                            </p>
                                        )}
                                        <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground pt-1">
                                            {activeEvent.venue && (
                                                <div className="flex items-center gap-1.5">
                                                    <MapPin className="size-3.5 text-emerald-600" />
                                                    <span>{activeEvent.venue}</span>
                                                </div>
                                            )}
                                            <div className="flex items-center gap-1.5">
                                                <Clock className="size-3.5 text-emerald-600" />
                                                <span>{activeEvent.event_date}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col sm:flex-row md:flex-col gap-2.5 shrink-0">
                                        <Button
                                            asChild
                                            className="rounded-xl bg-primary text-xs font-bold shadow-xs hover:bg-primary/90 h-10 px-5"
                                        >
                                            <Link href={primaryAction.href}>
                                                <span>Go to {primaryAction.title}</span>
                                                <ArrowRight className="size-3.5 ml-1.5" />
                                            </Link>
                                        </Button>
                                        <Button
                                            variant="outline"
                                            asChild
                                            className="rounded-xl text-xs font-bold h-10 px-5"
                                        >
                                            <Link href="/display" target="_blank">
                                                <Tv className="size-3.5 mr-1.5 text-emerald-600" />
                                                <span>Launch Display</span>
                                            </Link>
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                )}

                {/* Section 4: Operational Role Breakdown */}
                <section className="py-16 sm:py-20 lg:py-24">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="text-center max-w-2xl mx-auto mb-12">
                            <span className="text-xs font-bold tracking-widest uppercase text-emerald-600 dark:text-emerald-400">
                                Operational Workflows
                            </span>
                            <h2 className="mt-2 text-2xl sm:text-3xl font-black tracking-tight">
                                How ALAYON Serves Your Assembly Team
                            </h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Role 1: Emcees & Hosts */}
                            <div className="rounded-2xl border border-sky-200/80 bg-white p-6 shadow-xs dark:border-sky-900/40 dark:bg-neutral-900 flex flex-col justify-between">
                                <div>
                                    <div className="flex items-center justify-between mb-4">
                                        <span className="text-xs font-bold uppercase tracking-wider text-sky-700 dark:text-sky-400 bg-sky-100 dark:bg-sky-950/60 px-2.5 py-1 rounded-full">
                                            Stage Operations
                                        </span>
                                        <Megaphone className="size-5 text-sky-600" />
                                    </div>
                                    <h3 className="text-base font-bold mb-2">Stage Hosts & Emcees</h3>
                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                        Access the live announcement queue ordered by official seniority precedence. Trigger broadcast chimes, announce dignitary arrivals with speech synthesis, and confirm stage acknowledgements.
                                    </p>
                                </div>
                                <div className="mt-6 pt-4 border-t border-neutral-100 dark:border-neutral-800">
                                    <Link
                                        href="/host"
                                        className="text-xs font-bold text-sky-600 dark:text-sky-400 inline-flex items-center gap-1 hover:underline"
                                    >
                                        <span>Open Host Announcer</span>
                                        <ArrowRight className="size-3" />
                                    </Link>
                                </div>
                            </div>

                            {/* Role 2: Registration Staff */}
                            <div className="rounded-2xl border border-emerald-200/80 bg-white p-6 shadow-xs dark:border-emerald-900/40 dark:bg-neutral-900 flex flex-col justify-between">
                                <div>
                                    <div className="flex items-center justify-between mb-4">
                                        <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/60 px-2.5 py-1 rounded-full">
                                            Reception Desk
                                        </span>
                                        <UserCheck className="size-5 text-emerald-600" />
                                    </div>
                                    <h3 className="text-base font-bold mb-2">Registration Desk Staff</h3>
                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                        Quickly check in arriving delegates, link official representatives, verify jurisdictional data (Province/City/Barangay), and print formatted attendance sheets filtered by category.
                                    </p>
                                </div>
                                <div className="mt-6 pt-4 border-t border-neutral-100 dark:border-neutral-800">
                                    <Link
                                        href="/attendees"
                                        className="text-xs font-bold text-emerald-600 dark:text-emerald-400 inline-flex items-center gap-1 hover:underline"
                                    >
                                        <span>Open Attendance Registry</span>
                                        <ArrowRight className="size-3" />
                                    </Link>
                                </div>
                            </div>

                            {/* Role 3: Administrators */}
                            <div className="rounded-2xl border border-purple-200/80 bg-white p-6 shadow-xs dark:border-purple-900/40 dark:bg-neutral-900 flex flex-col justify-between">
                                <div>
                                    <div className="flex items-center justify-between mb-4">
                                        <span className="text-xs font-bold uppercase tracking-wider text-purple-700 dark:text-purple-400 bg-purple-100 dark:bg-purple-950/60 px-2.5 py-1 rounded-full">
                                            Executive Control
                                        </span>
                                        <Crown className="size-5 text-purple-600" />
                                    </div>
                                    <h3 className="text-base font-bold mb-2">Assembly Administrators</h3>
                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                        Manage guest categories, configure official seniority protocol order, create new events, oversee live metrics, and assign user level privileges to team members.
                                    </p>
                                </div>
                                <div className="mt-6 pt-4 border-t border-neutral-100 dark:border-neutral-800">
                                    <Link
                                        href="/settings"
                                        className="text-xs font-bold text-purple-600 dark:text-purple-400 inline-flex items-center gap-1 hover:underline"
                                    >
                                        <span>Open System Settings</span>
                                        <ArrowRight className="size-3" />
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            {/* Official Philippine Government / Assembly Footer */}
            <footer className="border-t border-neutral-200/80 bg-white dark:border-neutral-800/80 dark:bg-neutral-900/90 py-12">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
                        <div className="flex items-center gap-3">
                            <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-xs">
                                <Landmark className="size-4.5" />
                            </div>
                            <div>
                                <div className="text-sm font-black tracking-widest text-primary uppercase">
                                    ALAYON 2026
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    Stakeholders & LGU Leaders Assembly • Attendance & Protocol System
                                </div>
                            </div>
                        </div>

                        {/* Quick Nav Links */}
                        <div className="flex flex-wrap items-center justify-center gap-5 text-xs font-semibold text-muted-foreground">
                            <Link href="/dashboard" className="hover:text-foreground transition-colors">
                                Dashboard
                            </Link>
                            <Link href="/host" className="hover:text-foreground transition-colors">
                                Host Console
                            </Link>
                            <Link href="/attendees" className="hover:text-foreground transition-colors">
                                Attendance Registry
                            </Link>
                            <Link href="/display" target="_blank" className="hover:text-foreground transition-colors">
                                Big Screen
                            </Link>
                            <Link href="/menu" className="hover:text-foreground transition-colors">
                                Menu
                            </Link>
                        </div>
                    </div>

                    <div className="mt-8 pt-6 border-t border-neutral-100 dark:border-neutral-800/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
                        <p>© 2026 ALAYON Attendance. All rights reserved.</p>
                        <p className="flex items-center gap-1.5">
                            <ShieldCheck className="size-3.5 text-emerald-600" />
                            <span>Strengthening Collaborative Partnerships for Inclusive Community Resilience</span>
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
