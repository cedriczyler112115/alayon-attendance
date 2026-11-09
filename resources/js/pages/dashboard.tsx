import { Head, Link, usePage } from '@inertiajs/react';
import {
    ArrowRight,
    Building2,
    Calendar,
    CheckCircle2,
    Clock,
    Crown,
    ExternalLink,
    Landmark,
    MapPin,
    Megaphone,
    Plus,
    Shield,
    Sparkles,
    Tag,
    Tv,
    UserCheck,
    Users,
    Volume2,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import type { Attendee, EventItem, GuestCategory, User } from '@/types';

type CategoryWithCount = GuestCategory & {
    attendees_count: number;
    announced_count: number;
};

type Props = {
    activeEvent?: EventItem | null;
    categories: CategoryWithCount[];
    stats: {
        total_registered: number;
        total_announced: number;
        recent_announced: Attendee[];
        recent_registered: Attendee[];
    };
};

export default function Dashboard({
    activeEvent,
    categories = [],
    stats,
}: Props) {
    const { auth } = usePage().props as { auth?: { user?: User } };
    const user = auth?.user;
    const role = user?.role || 'staff';
    const isHost = role === 'host';
    const isStaff = role === 'staff';
    const isAdmin = role === 'admin';

    const pendingCount =
        (stats.total_registered || 0) - (stats.total_announced || 0);

    return (
        <>
            <Head title="Attendance & Announcement Dashboard" />

            <div className="flex flex-col gap-6 p-4 md:p-8">
                {/* Active Event Banner */}
                {activeEvent ? (
                    <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-linear-to-r from-primary/10 via-primary/5 to-transparent p-6 shadow-xs">
                        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                            <div>
                                <div className="flex items-center gap-2 text-xs font-semibold text-primary uppercase">
                                    <Sparkles className="size-4" />
                                    <span>Active Assembly Event</span>
                                    <Badge
                                        variant="outline"
                                        className="border-primary/40 bg-primary/10 text-primary"
                                    >
                                        Live
                                    </Badge>
                                </div>
                                <h1 className="mt-1.5 text-2xl font-black tracking-tight text-neutral-900 sm:text-3xl dark:text-white">
                                    {activeEvent.title}
                                </h1>
                                {activeEvent.theme && (
                                    <p className="mt-1 text-sm text-neutral-600 italic dark:text-neutral-400">
                                        "{activeEvent.theme}"
                                    </p>
                                )}
                                <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-neutral-600 dark:text-neutral-300">
                                    <span className="flex items-center gap-1.5">
                                        <Calendar className="size-3.5 text-primary" />
                                        {new Date(
                                            activeEvent.event_date,
                                        ).toLocaleDateString(undefined, {
                                            dateStyle: 'long',
                                        })}
                                    </span>
                                    {activeEvent.venue && (
                                        <span className="flex items-center gap-1.5">
                                            <MapPin className="size-3.5 text-primary" />
                                            {activeEvent.venue}
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-2.5">
                                {(isHost || isAdmin) && (
                                    <Button
                                        asChild
                                        className="gap-2 bg-primary font-semibold shadow-sm"
                                    >
                                        <Link href="/host">
                                            <Megaphone className="size-4" />
                                            Host Announcer
                                            <ArrowRight className="size-4" />
                                        </Link>
                                    </Button>
                                )}

                                {(isStaff || isAdmin) && (
                                    <Button
                                        asChild
                                        className="gap-2 bg-emerald-600 font-semibold text-white shadow-sm hover:bg-emerald-700"
                                    >
                                        <Link href="/attendees">
                                            <UserCheck className="size-4" />
                                            Attendance Registry
                                            <ArrowRight className="size-4" />
                                        </Link>
                                    </Button>
                                )}

                                <Button
                                    asChild
                                    variant="outline"
                                    className="gap-1.5"
                                >
                                    <Link
                                        href={`/events/${activeEvent.id}/display`}
                                        target="_blank"
                                    >
                                        <Tv className="size-4" />
                                        Big Screen Display
                                        <ExternalLink className="size-3 opacity-60" />
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <Card>
                        <CardHeader>
                            <CardTitle>No Active Event</CardTitle>
                            <CardDescription>
                                Create or activate an event to begin attendance
                                & announcements.
                            </CardDescription>
                        </CardHeader>
                    </Card>
                )}

                {/* Primary Metric Cards */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <Card className="shadow-xs">
                        <CardHeader className="pb-2">
                            <CardDescription className="flex items-center justify-between text-xs font-semibold tracking-wider text-neutral-500 uppercase">
                                <span>Total Registered</span>
                                <Users className="size-4 text-primary" />
                            </CardDescription>
                            <CardTitle className="text-3xl font-extrabold">
                                {stats.total_registered}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="text-xs text-muted-foreground">
                            Official delegates registered for attendance
                        </CardContent>
                    </Card>

                    <Card className="border-green-500/20 bg-green-500/5 shadow-xs">
                        <CardHeader className="pb-2">
                            <CardDescription className="flex items-center justify-between text-xs font-semibold tracking-wider text-green-700 uppercase dark:text-green-300">
                                <span>Announced VIPs</span>
                                <CheckCircle2 className="size-4 text-green-600 dark:text-green-400" />
                            </CardDescription>
                            <CardTitle className="text-3xl font-extrabold text-green-700 dark:text-green-400">
                                {stats.total_announced}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="text-xs text-green-600/80 dark:text-green-400/80">
                            Tagged as announced by the host
                        </CardContent>
                    </Card>

                    <Card className="border-amber-500/20 bg-amber-500/5 shadow-xs">
                        <CardHeader className="pb-2">
                            <CardDescription className="flex items-center justify-between text-xs font-semibold tracking-wider text-amber-700 uppercase dark:text-amber-300">
                                <span>Awaiting Announcement</span>
                                <Clock className="size-4 text-amber-600 dark:text-amber-400" />
                            </CardDescription>
                            <CardTitle className="text-3xl font-extrabold text-amber-700 dark:text-amber-400">
                                {pendingCount}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="text-xs text-amber-600/80 dark:text-amber-400/80">
                            In queue for emcee announcement
                        </CardContent>
                    </Card>
                </div>

                {/* Dynamic Category Breakdowns */}
                <div>
                    <div className="mb-3 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs font-semibold text-neutral-700 uppercase dark:text-neutral-300">
                            <Tag className="size-4 text-primary" />
                            <span>
                                Attendance Categorization (Dynamic Data)
                            </span>
                        </div>
                        {isAdmin && (
                            <Button
                                asChild
                                variant="ghost"
                                size="sm"
                                className="gap-1 text-xs text-primary"
                            >
                                <Link href="/categories">
                                    <span>Manage Categories</span>
                                    <ArrowRight className="size-3.5" />
                                </Link>
                            </Button>
                        )}
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {categories.map((cat) => {
                            const isAnnouncedAll =
                                cat.attendees_count > 0 &&
                                cat.announced_count === cat.attendees_count;
                            return (
                                <Card
                                    key={cat.id}
                                    className="transition-all hover:shadow-md"
                                >
                                    <CardHeader className="pb-2">
                                        <div className="flex items-center justify-between">
                                            <Badge
                                                variant="outline"
                                                className={
                                                    cat.scope === 'province'
                                                        ? 'border-purple-500/30 bg-purple-500/10 text-purple-700 dark:text-purple-300'
                                                        : cat.scope ===
                                                            'municipality'
                                                          ? 'border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-300'
                                                          : 'border-neutral-500/30 bg-neutral-500/10 text-neutral-700 dark:text-neutral-300'
                                                }
                                            >
                                                {cat.scope === 'province'
                                                    ? 'Province Scope'
                                                    : cat.scope ===
                                                        'municipality'
                                                      ? 'Municipality Scope'
                                                      : 'General'}
                                            </Badge>
                                            <span className="text-xs font-bold text-neutral-500">
                                                {cat.announced_count} /{' '}
                                                {cat.attendees_count} Announced
                                            </span>
                                        </div>
                                        <CardTitle className="mt-2 text-xl font-bold">
                                            {cat.name}
                                        </CardTitle>
                                        <CardDescription className="line-clamp-1 text-xs">
                                            {cat.description ||
                                                `Registered ${cat.name}`}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="pt-2">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-muted-foreground">
                                                Progress:
                                            </span>
                                            <span className="font-semibold">
                                                {cat.attendees_count > 0
                                                    ? `${Math.round((cat.announced_count / cat.attendees_count) * 100)}%`
                                                    : '0%'}
                                            </span>
                                        </div>
                                        <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
                                            <div
                                                className="h-full bg-primary transition-all"
                                                style={{
                                                    width:
                                                        cat.attendees_count > 0
                                                            ? `${(cat.announced_count / cat.attendees_count) * 100}%`
                                                            : '0%',
                                                }}
                                            />
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                </div>

                {/* Bottom Row: Recent Announcements & Quick Navigation */}
                <div className="grid gap-6 lg:grid-cols-2">
                    {/* Recent Announced Guests */}
                    <Card className="shadow-xs">
                        <CardHeader className="flex flex-row items-center justify-between pb-3">
                            <div>
                                <CardTitle className="text-base font-bold">
                                    Recent Announced Guests
                                </CardTitle>
                                <CardDescription className="text-xs">
                                    Latest VIPs called by the host
                                </CardDescription>
                            </div>
                            {(isHost || isAdmin) && (
                                <Button
                                    asChild
                                    variant="ghost"
                                    size="sm"
                                    className="gap-1 text-xs text-primary"
                                >
                                    <Link href="/host">
                                        <span>Host Console</span>
                                        <ArrowRight className="size-3.5" />
                                    </Link>
                                </Button>
                            )}
                            {isStaff && (
                                <Button
                                    asChild
                                    variant="ghost"
                                    size="sm"
                                    className="gap-1 text-xs text-emerald-600"
                                >
                                    <Link href="/attendees">
                                        <span>Attendees</span>
                                        <ArrowRight className="size-3.5" />
                                    </Link>
                                </Button>
                            )}
                        </CardHeader>
                        <CardContent className="divide-y divide-neutral-100 p-0 dark:divide-neutral-800">
                            {stats.recent_announced &&
                            stats.recent_announced.length > 0 ? (
                                stats.recent_announced.map((attendee) => (
                                    <div
                                        key={attendee.id}
                                        className="flex items-center justify-between px-6 py-3.5"
                                    >
                                        <div>
                                            <div className="text-sm font-semibold">
                                                {attendee.name ||
                                                    attendee.fullname}
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                {attendee.category?.name}
                                                {attendee.city?.city_name &&
                                                    ` • ${attendee.city.city_name}`}
                                                {attendee.province?.prov_name &&
                                                    `, ${attendee.province.prov_name}`}
                                                {attendee.barangay &&
                                                    ` (Brgy. ${attendee.barangay.brgy_name})`}
                                            </div>
                                        </div>
                                        <Badge
                                            variant="outline"
                                            className="border-green-500/30 bg-green-500/10 text-xs text-green-700 dark:text-green-300"
                                        >
                                            Called
                                        </Badge>
                                    </div>
                                ))
                            ) : (
                                <div className="p-8 text-center text-xs text-muted-foreground">
                                    No attendees have been announced yet.
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Quick Role-Specific Navigation Shortcuts */}
                    <Card className="shadow-xs">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base font-bold">
                                Assembly Quick Operations
                            </CardTitle>
                            <CardDescription className="text-xs">
                                Shortcuts to key attendance and announcement
                                workflows
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-3 sm:grid-cols-2">
                            {(isHost || isAdmin) && (
                                <Link
                                    href="/host"
                                    className="group flex flex-col justify-between rounded-xl border border-neutral-200 bg-white p-4 transition-all hover:border-primary hover:shadow-xs dark:border-neutral-800 dark:bg-neutral-900"
                                >
                                    <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                        <Megaphone className="size-5" />
                                    </div>
                                    <div className="mt-3">
                                        <div className="text-sm font-bold text-neutral-900 group-hover:text-primary dark:text-white">
                                            Host Announcer Console
                                        </div>
                                        <div className="text-xs text-neutral-500">
                                            Tag arrival announcements in real
                                            time
                                        </div>
                                    </div>
                                </Link>
                            )}

                            {(isStaff || isAdmin) && (
                                <Link
                                    href="/attendees"
                                    className="group flex flex-col justify-between rounded-xl border border-neutral-200 bg-white p-4 transition-all hover:border-primary hover:shadow-xs dark:border-neutral-800 dark:bg-neutral-900"
                                >
                                    <div className="flex size-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
                                        <UserCheck className="size-5" />
                                    </div>
                                    <div className="mt-3">
                                        <div className="text-sm font-bold text-neutral-900 group-hover:text-primary dark:text-white">
                                            Attendance Registry
                                        </div>
                                        <div className="text-xs text-neutral-500">
                                            Manage guest entries & check-ins
                                        </div>
                                    </div>
                                </Link>
                            )}

                            <Link
                                href="/display"
                                target="_blank"
                                className="group flex flex-col justify-between rounded-xl border border-neutral-200 bg-white p-4 transition-all hover:border-primary hover:shadow-xs dark:border-neutral-800 dark:bg-neutral-900"
                            >
                                <div className="flex size-10 items-center justify-center rounded-lg bg-purple-500/10 text-purple-600">
                                    <Tv className="size-5" />
                                </div>
                                <div className="mt-3">
                                    <div className="flex items-center gap-1 text-sm font-bold text-neutral-900 group-hover:text-primary dark:text-white">
                                        <span>Big Screen / Projector</span>
                                        <ExternalLink className="size-3 opacity-60" />
                                    </div>
                                    <div className="text-xs text-neutral-500">
                                        Live LED display for arrivals
                                    </div>
                                </div>
                            </Link>

                            {isAdmin && (
                                <Link
                                    href="/categories"
                                    className="group flex flex-col justify-between rounded-xl border border-neutral-200 bg-white p-4 transition-all hover:border-primary hover:shadow-xs dark:border-neutral-800 dark:bg-neutral-900"
                                >
                                    <div className="flex size-10 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600">
                                        <Tag className="size-5" />
                                    </div>
                                    <div className="mt-3">
                                        <div className="text-sm font-bold text-neutral-900 group-hover:text-primary dark:text-white">
                                            Dynamic Categories
                                        </div>
                                        <div className="text-xs text-neutral-500">
                                            Add/edit governors, mayors, pswdo,
                                            cswdo
                                        </div>
                                    </div>
                                </Link>
                            )}

                            {isHost && (
                                <Link
                                    href="/settings/announcer"
                                    className="group flex flex-col justify-between rounded-xl border border-neutral-200 bg-white p-4 transition-all hover:border-primary hover:shadow-xs dark:border-neutral-800 dark:bg-neutral-900"
                                >
                                    <div className="flex size-10 items-center justify-center rounded-lg bg-sky-500/10 text-sky-600">
                                        <Volume2 className="size-5" />
                                    </div>
                                    <div className="mt-3">
                                        <div className="text-sm font-bold text-neutral-900 group-hover:text-primary dark:text-white">
                                            Announcer Audio Settings
                                        </div>
                                        <div className="text-xs text-neutral-500">
                                            Configure chimes, speech rate &
                                            volume
                                        </div>
                                    </div>
                                </Link>
                            )}

                            {isAdmin && (
                                <Link
                                    href="/settings/users"
                                    className="group flex flex-col justify-between rounded-xl border border-neutral-200 bg-white p-4 transition-all hover:border-primary hover:shadow-xs dark:border-neutral-800 dark:bg-neutral-900"
                                >
                                    <div className="flex size-10 items-center justify-center rounded-lg bg-purple-500/10 text-purple-600">
                                        <Crown className="size-5" />
                                    </div>
                                    <div className="mt-3">
                                        <div className="text-sm font-bold text-neutral-900 group-hover:text-primary dark:text-white">
                                            User Level Privileges
                                        </div>
                                        <div className="text-xs text-neutral-500">
                                            Assign Host, Staff, Admin
                                            permissions
                                        </div>
                                    </div>
                                </Link>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
}

Dashboard.layout = {
    breadcrumbs: [{ title: 'Dashboard', href: '/dashboard' }],
};
