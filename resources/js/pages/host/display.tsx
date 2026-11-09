import { Head, Link } from '@inertiajs/react';
import {
    Calendar,
    Clock,
    Expand,
    Home,
    Landmark,
    LayoutGrid,
    MapPin,
    Maximize,
    Megaphone,
    Minimize,
    Sparkles,
    Users,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getAttendeePositionWithJurisdiction } from '@/lib/host-announcer-utils';
import type { Attendee, EventItem, GuestCategory } from '@/types';

type Props = {
    event: EventItem;
    latestAnnounced?: Attendee | null;
    recentAnnouncements: Attendee[];
    categories: GuestCategory[];
    stats: {
        total: number;
        announced: number;
    };
};

export default function BigScreenDisplay({
    event,
    latestAnnounced: initialLatest,
    recentAnnouncements: initialRecents,
    categories,
    stats: initialStats,
}: Props) {
    const [latest, setLatest] = useState<Attendee | null | undefined>(
        initialLatest,
    );
    const [recentList, setRecentList] = useState<Attendee[]>(initialRecents);
    const [stats, setStats] = useState(initialStats);
    const [currentTime, setCurrentTime] = useState(
        new Date().toLocaleTimeString(),
    );
    const [isFullscreen, setIsFullscreen] = useState(false);

    // Live Clock
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(
                new Date().toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                }),
            );
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    // Polling for live announcements
    useEffect(() => {
        const pollInterval = setInterval(() => {
            fetch(`/api/events/${event.id}/poll`)
                .then((res) => res.json())
                .then((data) => {
                    if (data.latest) {
                        setLatest(data.latest);
                    }
                    if (data.recent) {
                        setRecentList(data.recent);
                    }
                    if (data.stats) {
                        setStats(data.stats);
                    }
                })
                .catch(() => {});
        }, 4000);

        return () => clearInterval(pollInterval);
    }, [event.id]);

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement
                .requestFullscreen()
                .then(() => setIsFullscreen(true))
                .catch(() => {});
        } else {
            document
                .exitFullscreen()
                .then(() => setIsFullscreen(false))
                .catch(() => {});
        }
    };

    const getCategoryColors = (slug?: string) => {
        switch (slug) {
            case 'governors':
                return {
                    bg: 'from-purple-900/60 to-purple-950/80 border-purple-500/50 text-purple-200',
                    pill: 'bg-purple-500 text-white',
                };
            case 'mayors':
                return {
                    bg: 'from-blue-900/60 to-blue-950/80 border-blue-500/50 text-blue-200',
                    pill: 'bg-blue-500 text-white',
                };
            case 'pswdo':
                return {
                    bg: 'from-emerald-900/60 to-emerald-950/80 border-emerald-500/50 text-emerald-200',
                    pill: 'bg-emerald-500 text-white',
                };
            case 'cswdo':
                return {
                    bg: 'from-amber-900/60 to-amber-950/80 border-amber-500/50 text-amber-200',
                    pill: 'bg-amber-500 text-white',
                };
            default:
                return {
                    bg: 'from-neutral-900/60 to-neutral-950/80 border-neutral-700 text-neutral-200',
                    pill: 'bg-neutral-600 text-white',
                };
        }
    };

    const colors = getCategoryColors(latest?.category?.slug);

    return (
        <div className="flex min-h-screen flex-col bg-[#07090e] text-white">
            <Head title={`Live Display - ${event.title}`} />

            {/* Top Bar */}
            <header className="flex items-center justify-between border-b border-white/10 bg-white/5 px-6 py-4 backdrop-blur-md">
                <div className="flex items-center gap-4">
                    <div className="flex size-11 items-center justify-center rounded-2xl bg-linear-to-tr from-amber-500 to-primary text-white shadow-lg">
                        <Landmark className="size-6" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2 text-xs font-semibold tracking-widest text-amber-400 uppercase">
                            <Sparkles className="size-3.5" />
                            <span>Official Arrival & Announcement Screen</span>
                        </div>
                        <h1 className="text-xl font-black tracking-tight sm:text-2xl">
                            {event.title}
                        </h1>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {/* Live Clock */}
                    <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/40 px-4 py-2 font-mono text-sm text-neutral-300 shadow-inner">
                        <Clock className="size-4 text-amber-400" />
                        <span className="text-base font-bold">
                            {currentTime}
                        </span>
                    </div>

                    {/* Stats */}
                    <div className="hidden items-center gap-2 rounded-xl border border-white/10 bg-black/40 px-4 py-2 text-xs text-neutral-300 md:flex">
                        <Users className="size-4 text-primary" />
                        <span>
                            Announced: <strong>{stats.announced}</strong> /{' '}
                            {stats.total}
                        </span>
                    </div>

                    {/* Menu Link on Mobile */}
                    <Button
                        variant="outline"
                        size="sm"
                        asChild
                        className="gap-1.5 border-white/20 bg-white/10 px-2.5 text-xs font-medium text-white hover:bg-white/20 md:hidden"
                    >
                        <Link href="/menu" prefetch>
                            <LayoutGrid className="size-3.5 text-amber-400" />
                            <span>Menu</span>
                        </Link>
                    </Button>

                    {/* Fullscreen Button */}
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={toggleFullscreen}
                        className="border-white/20 bg-white/10 text-white hover:bg-white/20"
                        title={
                            isFullscreen
                                ? 'Exit Fullscreen'
                                : 'Enter Fullscreen'
                        }
                    >
                        {isFullscreen ? (
                            <Minimize className="size-4" />
                        ) : (
                            <Maximize className="size-4" />
                        )}
                    </Button>
                </div>
            </header>

            {/* Main Stage Content */}
            <main className="flex w-full flex-1 flex-col justify-between px-6 py-6 sm:px-10 sm:py-8">
                {/* Hero Announcement Spotlight */}
                <div className="flex w-full flex-1 items-center justify-center py-4">
                    {latest ? (
                        <div className="relative w-full animate-in duration-500 zoom-in-95">
                            {/* Decorative ambient glow */}
                            <div className="absolute -inset-1 rounded-3xl bg-linear-to-r from-amber-500/20 via-primary/30 to-purple-500/20 opacity-75 blur-2xl" />

                            <div
                                className={`relative flex flex-col items-center justify-center rounded-3xl border bg-linear-to-b ${colors.bg} w-full px-8 py-10 text-center shadow-2xl backdrop-blur-xl sm:px-14 sm:py-14 md:py-16`}
                            >
                                <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-amber-400/40 bg-amber-400/10 px-5 py-2 text-xs font-bold tracking-widest text-amber-300 uppercase shadow-xs sm:text-sm">
                                    <Megaphone className="size-4 animate-bounce sm:size-5" />
                                    <span>
                                        WELCOMING & ARRIVAL ANNOUNCEMENT
                                    </span>
                                </div>

                                <div className="mb-5">
                                    <span
                                        className={`inline-block rounded-2xl px-6 py-2 text-sm font-black tracking-widest uppercase shadow-md sm:text-base ${colors.pill}`}
                                    >
                                        {latest.category?.name ||
                                            'SPECIAL GUEST'}
                                    </span>
                                </div>

                                {/* Guest Name */}
                                <h2 className="text-4xl font-black tracking-tight text-white drop-shadow-lg sm:text-6xl md:text-7xl lg:text-8xl">
                                    {latest.name || latest.fullname}
                                </h2>

                                {/* Designation / Position with Jurisdiction */}
                                <p className="mt-4 text-xl font-bold tracking-wide text-amber-200/95 sm:text-3xl md:text-4xl">
                                    {getAttendeePositionWithJurisdiction(
                                        latest,
                                    )}
                                </p>

                                {/* Representative Notice */}
                                {!latest.is_attending &&
                                    latest.rep_fullname && (
                                        <div className="mt-4 inline-flex items-center gap-2 rounded-2xl border border-amber-400/40 bg-amber-500/20 px-6 py-2 text-lg font-semibold text-amber-200 shadow-md sm:text-2xl">
                                            <span>
                                                Represented by:{' '}
                                                <strong>
                                                    {latest.rep_prefix_name
                                                        ? `${latest.rep_prefix_name} `
                                                        : ''}
                                                    {latest.rep_fullname}
                                                </strong>
                                            </span>
                                            {latest.rep_position && (
                                                <span className="text-base font-normal text-amber-300/80 sm:text-xl">
                                                    ({latest.rep_position})
                                                </span>
                                            )}
                                        </div>
                                    )}

                                {/* Jurisdiction */}
                                <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-base font-medium text-neutral-200 sm:gap-4 sm:text-xl">
                                    {latest.city?.city_name && (
                                        <div className="flex items-center gap-2 rounded-xl border border-white/15 bg-black/50 px-5 py-2.5 shadow-md">
                                            <MapPin className="size-5 text-amber-400" />
                                            <span className="font-semibold">
                                                {latest.city.city_name}
                                            </span>
                                        </div>
                                    )}
                                    {latest.province?.prov_name && (
                                        <div className="flex items-center gap-2 rounded-xl border border-white/15 bg-black/50 px-5 py-2.5 shadow-md">
                                            <MapPin className="size-5 text-purple-400" />
                                            <span>
                                                Province of{' '}
                                                <strong>
                                                    {latest.province.prov_name}
                                                </strong>
                                            </span>
                                        </div>
                                    )}
                                    {latest.barangay && (
                                        <div className="flex items-center gap-2 rounded-xl border border-white/15 bg-black/50 px-5 py-2.5 shadow-md">
                                            <MapPin className="size-5 text-emerald-400" />
                                            <span>
                                                Brgy.{' '}
                                                <strong>
                                                    {latest.barangay.brgy_name}
                                                </strong>
                                            </span>
                                        </div>
                                    )}
                                </div>

                                <div className="mt-8 text-xs text-neutral-400 sm:text-sm">
                                    Announced at{' '}
                                    {new Date(
                                        latest.updated_at ||
                                            latest.created_at ||
                                            Date.now(),
                                    ).toLocaleTimeString()}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-16 text-center text-neutral-500">
                            <Megaphone className="size-20 animate-pulse text-amber-400 opacity-30" />
                            <h3 className="mt-6 text-2xl font-bold text-neutral-200 sm:text-3xl">
                                Awaiting Host Announcements
                            </h3>
                            <p className="mt-2 text-sm text-neutral-400 sm:text-base">
                                Guest arrival announcements will appear here
                                across the screen automatically
                            </p>
                        </div>
                    )}
                </div>

                {/* Bottom Ticker: Recent Arrivals */}
                <div className="mt-8 w-full border-t border-white/10 pt-5">
                    <div className="mb-3 flex items-center justify-between text-xs font-semibold tracking-wider text-neutral-400 uppercase">
                        <div className="flex items-center gap-2">
                            <Sparkles className="size-3.5 text-amber-400" />
                            <span>Recent Distinguished Arrivals</span>
                        </div>
                        <span>Live stream</span>
                    </div>

                    <div className="flex scrollbar-none gap-4 overflow-x-auto pb-2">
                        {recentList.map((guest) => {
                            const c = getCategoryColors(guest.category?.slug);
                            const initials = (
                                guest.fullname ||
                                guest.name ||
                                'G'
                            )
                                .split(' ')
                                .filter(Boolean)
                                .slice(0, 2)
                                .map((s) => s[0]?.toUpperCase())
                                .join('');

                            return (
                                <div
                                    key={guest.id}
                                    className="flex min-w-[260px] items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3.5 backdrop-blur-md transition-all"
                                >
                                    <div
                                        className={`flex size-10 shrink-0 items-center justify-center rounded-xl text-xs font-bold ${c.pill}`}
                                    >
                                        {initials}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="truncate text-sm font-bold text-white">
                                            {guest.name || guest.fullname}
                                        </div>
                                        <div className="truncate text-xs text-neutral-400">
                                            {getAttendeePositionWithJurisdiction(
                                                guest,
                                            )}
                                        </div>
                                    </div>
                                    <Badge
                                        variant="outline"
                                        className="border-white/20 bg-white/5 text-[10px] text-amber-300"
                                    >
                                        {guest.category?.name}
                                    </Badge>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </main>
        </div>
    );
}

BigScreenDisplay.layout = null;
