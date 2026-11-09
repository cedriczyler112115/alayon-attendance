import { Head, Link, router } from '@inertiajs/react';
import {
    Calendar,
    Check,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Clock,
    Crown,
    ExternalLink,
    Filter,
    MapPin,
    Megaphone,
    Pencil,
    Plus,
    Printer,
    RotateCcw,
    Search,
    Trash2,
    UserCheck,
    Users,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { MultiSelect } from '@/components/ui/multi-select';
import { Select2 } from '@/components/ui/select2';
import { RegisterGuestDialog } from '@/components/register-guest-dialog';
import { UpdateAttendeeDialog } from '@/components/update-attendee-dialog';
import { PrintAttendeesDialog } from '@/components/print-attendees-dialog';
import { getCategoryCustomField } from '@/lib/category-custom-fields';
import {
    getAttendeePositionWithJurisdiction,
    getCategoryBadgeClass,
} from '@/lib/host-announcer-utils';
import { cn } from '@/lib/utils';
import type { Attendee, CityItem, EventItem, GuestCategory, ProvinceItem } from '@/types';

function formatRegistrationDate(created_at?: string | null) {
    if (!created_at) return { date: '—', time: '' };
    try {
        const d = new Date(created_at);
        return {
            date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            time: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
    } catch {
        return { date: created_at, time: '' };
    }
}

type Paginated<T> = {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from?: number | null;
    to?: number | null;
    links: { url: string | null; label: string; active: boolean }[];
};

type Props = {
    currentEvent?: EventItem | null;
    events: { id: number; title: string; status: string; event_date: string }[];
    categories: GuestCategory[];
    provinces?: ProvinceItem[];
    cities?: CityItem[];
    attendees: Paginated<Attendee>;
    filters: {
        event_id?: string | number;
        category_id?: string | number;
        category_ids?: string;
        status?: string;
        search?: string;
        per_page?: string | number;
        attendance_mode?: string;
        province_id?: string | number;
        city_id?: string | number;
    };
};

export default function AttendanceIndex({
    currentEvent,
    events,
    categories,
    provinces = [],
    cities = [],
    attendees,
    filters,
}: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [isRegistering, setIsRegistering] = useState(false);
    const [editingAttendee, setEditingAttendee] = useState<Attendee | null>(null);
    const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

    const handleFilterChange = (key: string, value: string) => {
        const newFilters: Record<string, any> = {
            ...filters,
            [key]: value || undefined,
            page: 1,
        };
        if (key === 'category_ids') {
            delete newFilters.category_id;
        }
        if (!value) {
            delete newFilters[key];
        }
        router.get('/attendees', newFilters, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        handleFilterChange('search', search);
    };

    const handleAnnounce = (id: number) => {
        router.post(`/attendees/${id}/announce`, {}, { preserveScroll: true });
    };

    const handleUnannounce = (id: number) => {
        router.post(`/attendees/${id}/unannounce`, {}, { preserveScroll: true });
    };

    const handleEditAttendee = (attendee: Attendee) => {
        if (attendee.status === 'called') {
            toast.warning('Cannot update an attendee whose status is called. Undo call first.');
            return;
        }
        setEditingAttendee(attendee);
    };

    const handleDelete = (attendee: Attendee) => {
        if (attendee.status === 'called') {
            toast.error('Cannot delete an attendee whose status is called. Undo call first.');
            return;
        }
        const name = attendee.name || attendee.fullname;
        if (confirm(`Are you sure you want to delete attendee "${name}"? This action cannot be undone.`)) {
            router.delete(`/attendees/${attendee.id}`, { preserveScroll: true });
        }
    };

    return (
        <>
            <Head title="Attendance Registry" />

            <div className="flex flex-col gap-6 p-4 md:p-8">
                {/* Attendees Registry Card with Integrated Filters & Table */}
                <Card className="shadow-xs">
                    <CardHeader className="flex flex-col gap-3 border-b border-neutral-100 pb-4 sm:flex-row sm:items-center sm:justify-between dark:border-neutral-800">
                        <div>
                            <CardTitle className="text-lg font-bold">Attendees Registry</CardTitle>
                            <CardDescription>
                                Total {attendees.total} registered records found
                            </CardDescription>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                className="gap-1.5 font-semibold text-neutral-800 dark:text-neutral-200 shadow-xs hover:border-primary/50"
                                onClick={() => setIsPrintModalOpen(true)}
                            >
                                <Printer className="size-4 text-primary" />
                                <span>Print</span>
                            </Button>
                            {currentEvent && (
                                <Button
                                    size="sm"
                                    className="gap-1.5"
                                    onClick={() => setIsRegistering(true)}
                                >
                                    <Plus className="size-4" />
                                    <span>Register Guest</span>
                                </Button>
                            )}
                            <Button asChild variant="outline" size="sm" className="gap-1.5">
                                <Link href="/host">
                                    <Megaphone className="size-4" />
                                    <span>Host Announcer Console</span>
                                </Link>
                            </Button>
                        </div>
                    </CardHeader>

                    {/* Integrated Filters Toolbar */}
                    <div className="border-b border-neutral-200/80 bg-neutral-50/50 p-4 dark:border-neutral-800 dark:bg-neutral-900/30">
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                            {/* Category Multi-Select */}
                            <div>
                                <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">Categories</label>
                                <MultiSelect
                                    value={
                                        filters.category_ids
                                            ? String(filters.category_ids).split(',').filter(Boolean)
                                            : filters.category_id
                                              ? [filters.category_id]
                                              : []
                                    }
                                    onChange={(vals) => handleFilterChange('category_ids', vals.join(','))}
                                    options={categories.map((cat) => ({
                                        value: cat.id,
                                        label: cat.name,
                                        badge: cat.scope,
                                    }))}
                                    placeholder="All Categories"
                                    searchPlaceholder="Search categories..."
                                    allLabel="All Categories"
                                    maxDisplayBadges={1}
                                    className="mt-1"
                                />
                            </div>

                            {/* Attendance / Representative Confirmation */}
                            <div>
                                <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">Attendance / Rep</label>
                                <Select2
                                    value={filters.attendance_mode || ''}
                                    onChange={(val) => handleFilterChange('attendance_mode', String(val))}
                                    options={[
                                        { value: '', label: 'All (With & Without Rep)' },
                                        { value: 'without_rep', label: 'In Person (Without Rep)' },
                                        { value: 'with_rep', label: 'Via Representative' },
                                    ]}
                                    placeholder="All Attendance Modes"
                                    searchPlaceholder="Filter mode..."
                                    clearable={Boolean(filters.attendance_mode)}
                                    className="mt-1"
                                />
                            </div>

                            {/* Attendance Status */}
                            <div>
                                <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">Status</label>
                                <Select2
                                    value={filters.status || ''}
                                    onChange={(val) => handleFilterChange('status', String(val))}
                                    options={[
                                        { value: '', label: 'All Statuses' },
                                        { value: 'invited', label: 'Invited' },
                                        { value: 'registered', label: 'Registered' },
                                        { value: 'called', label: 'Called (Announced)' },
                                    ]}
                                    placeholder="All Statuses"
                                    searchPlaceholder="Search status..."
                                    clearable={Boolean(filters.status)}
                                    className="mt-1"
                                />
                            </div>

                            {/* Search */}
                            <div>
                                <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">Search</label>
                                <form onSubmit={handleSearchSubmit} className="mt-1 flex gap-2">
                                    <Input
                                        type="search"
                                        placeholder="Name, province, city..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        className="h-9.5 text-xs"
                                    />
                                    <Button type="submit" size="sm" variant="outline" className="h-9.5 px-3">
                                        <Search className="size-3.5" />
                                    </Button>
                                </form>
                            </div>
                        </div>
                    </div>
                    <CardContent className="p-0">
                        {/* Top Table Controls (Top Left records info & per-page selector) */}
                        <div className="flex flex-col gap-3 border-b border-neutral-200/80 px-6 py-3 sm:flex-row sm:items-center sm:justify-between dark:border-neutral-800">
                            {/* Left: Records info & Records Per Page */}
                            <div className="flex flex-wrap items-center gap-4 text-xs text-neutral-600 dark:text-neutral-400">
                                <div>
                                    Showing <span className="font-semibold text-neutral-900 dark:text-white">{attendees.from || (attendees.total > 0 ? 1 : 0)}</span> to{' '}
                                    <span className="font-semibold text-neutral-900 dark:text-white">{attendees.to || attendees.total}</span> of{' '}
                                    <span className="font-semibold text-neutral-900 dark:text-white">{attendees.total}</span> records
                                </div>

                                <div className="flex items-center gap-1.5">
                                    <span className="text-neutral-500">Records per page:</span>
                                    <select
                                        value={String(filters.per_page || '20')}
                                        onChange={(e) => handleFilterChange('per_page', e.target.value)}
                                        className="h-7.5 rounded-md border border-neutral-300 bg-white px-2 py-0.5 text-xs font-medium text-neutral-900 shadow-2xs focus:border-primary focus:outline-hidden focus:ring-1 focus:ring-primary dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
                                    >
                                        <option value="10">10</option>
                                        <option value="20">20</option>
                                        <option value="25">25</option>
                                        <option value="50">50</option>
                                        <option value="100">100</option>
                                        <option value="all">All</option>
                                    </select>
                                </div>
                            </div>

                            {/* Right: Top Pagination Navigation Links */}
                            {attendees.links && attendees.links.length > 3 && (
                                <div className="flex flex-wrap items-center gap-1">
                                    {attendees.links.map((link, idx) => (
                                        <button
                                            key={idx}
                                            disabled={!link.url}
                                            onClick={() => link.url && router.visit(link.url, { preserveState: true, preserveScroll: true })}
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                            className={`rounded-md px-2.5 py-1 text-xs transition-colors ${
                                                link.active
                                                    ? 'bg-primary font-bold text-primary-foreground shadow-xs'
                                                    : 'border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800'
                                            } ${!link.url ? 'opacity-40 cursor-not-allowed' : ''}`}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Desktop Tabular View (Hidden on mobile < md) */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="border-y border-neutral-200 bg-neutral-50/70 text-xs text-neutral-500 uppercase dark:border-neutral-800 dark:bg-neutral-900/60 dark:text-neutral-400">
                                    <tr>
                                        <th className="px-6 py-3.5">Guest Official</th>
                                        <th className="px-6 py-3.5">Category</th>
                                        <th className="px-6 py-3.5">Official Position</th>
                                        <th className="px-6 py-3.5">Attendance Confirmation</th>
                                        <th className="px-6 py-3.5">Jurisdiction (LGU)</th>
                                        <th className="px-6 py-3.5">Registered At</th>
                                        <th className="px-6 py-3.5">Status</th>
                                        <th className="px-6 py-3.5 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                                    {attendees.data.length === 0 ? (
                                        <tr>
                                            <td colSpan={8} className="px-6 py-12 text-center text-muted-foreground">
                                                No attendance records found.
                                            </td>
                                        </tr>
                                    ) : (
                                        attendees.data.map((attendee) => {
                                            const { date, time } = formatRegistrationDate(attendee.created_at);
                                            const isCalled = attendee.status === 'called';
                                            return (
                                                <tr key={attendee.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-900/40 transition-colors">
                                                    {/* Guest Official */}
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="font-mono text-[10px] font-semibold text-neutral-400 dark:text-neutral-500">
                                                                #{attendee.id}
                                                            </span>
                                                            <span className="font-bold text-neutral-900 dark:text-white">
                                                                {attendee.name || attendee.fullname}
                                                            </span>
                                                        </div>
                                                    </td>

                                                    {/* Category */}
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <Badge variant="outline" className="font-medium text-xs">
                                                            {attendee.category?.name || 'Guest'}
                                                        </Badge>
                                                        {attendee.category?.scope && (
                                                            <div className="text-[10px] text-neutral-400 mt-0.5">
                                                                {attendee.category.scope === 'province'
                                                                    ? 'Province Level'
                                                                    : attendee.category.scope === 'municipality'
                                                                      ? 'Per City/Mun'
                                                                      : 'General'}
                                                            </div>
                                                        )}
                                                    </td>

                                                    {/* Official Position */}
                                                    <td className="px-6 py-4 text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                                                        <div>{attendee.position || attendee.designation || '—'}</div>
                                                        {attendee.agency_name && (
                                                            <div className="text-[11px] font-medium text-primary dark:text-primary-foreground/90 mt-0.5">
                                                                {getCategoryCustomField(attendee.category)?.label ? `${getCategoryCustomField(attendee.category)?.label}: ` : ''}
                                                                {attendee.agency_name}
                                                            </div>
                                                        )}
                                                    </td>

                                                    {/* Attendance Confirmation & Representative */}
                                                    <td className="px-6 py-4">
                                                        {attendee.is_attending !== false ? (
                                                            <div className="flex flex-col gap-0.5">
                                                                <Badge
                                                                    variant="outline"
                                                                    className="w-fit border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-[10px] px-2 py-0.5 gap-1 font-semibold"
                                                                >
                                                                    <UserCheck className="size-3 text-emerald-600 dark:text-emerald-400" />
                                                                    <span>In Person</span>
                                                                </Badge>
                                                                <span className="text-[10px] text-neutral-400">Attending personally</span>
                                                            </div>
                                                        ) : (
                                                            <div className="flex flex-col gap-1 text-xs">
                                                                <Badge
                                                                    variant="outline"
                                                                    className="w-fit border-amber-500/40 bg-amber-500/10 text-amber-800 dark:text-amber-300 text-[10px] px-2 py-0.5 gap-1 font-semibold"
                                                                >
                                                                    <Users className="size-3 text-amber-600 dark:text-amber-400" />
                                                                    <span>Via Representative</span>
                                                                </Badge>
                                                                {attendee.rep_fullname ? (
                                                                    <>
                                                                        <div className="font-semibold text-neutral-900 dark:text-neutral-100 text-xs mt-0.5">
                                                                            {attendee.rep_prefix_name ? `${attendee.rep_prefix_name} ` : ''}
                                                                            {attendee.rep_fullname}
                                                                        </div>
                                                                        {attendee.rep_position && (
                                                                            <span className="text-[11px] text-neutral-500 dark:text-neutral-400 italic">
                                                                                {attendee.rep_position}
                                                                            </span>
                                                                        )}
                                                                    </>
                                                                ) : (
                                                                    <span className="text-[11px] text-neutral-400 italic">No representative details</span>
                                                                )}
                                                            </div>
                                                        )}
                                                    </td>

                                                    {/* Jurisdiction (LGU) */}
                                                    <td className="px-6 py-4 text-xs">
                                                        <div className="flex items-start gap-1.5">
                                                            <MapPin className="size-3.5 text-neutral-400 shrink-0 mt-0.5" />
                                                            <div>
                                                                <div className="font-semibold text-neutral-900 dark:text-neutral-100">
                                                                    {attendee.city?.city_name || attendee.province?.prov_name || '—'}
                                                                </div>
                                                                {attendee.city && attendee.province && (
                                                                    <div className="text-[11px] text-neutral-500">
                                                                        {attendee.province.prov_name}
                                                                    </div>
                                                                )}
                                                                {attendee.barangay && (
                                                                    <div className="text-[10px] text-neutral-400">
                                                                        Brgy. {attendee.barangay.brgy_name}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </td>

                                                    {/* Registered At */}
                                                    <td className="px-6 py-4 text-xs whitespace-nowrap">
                                                        <div className="flex flex-col gap-0.5">
                                                            <div className="flex items-center gap-1 font-medium text-neutral-800 dark:text-neutral-200">
                                                                <Clock className="size-3 text-neutral-400" />
                                                                <span>{time || '—'}</span>
                                                            </div>
                                                            <div className="text-[11px] text-neutral-500">
                                                                {date}
                                                            </div>
                                                            {attendee.creator?.name && (
                                                                <span className="text-[10px] text-neutral-400 truncate max-w-[130px]" title={`Logged by ${attendee.creator.name}`}>
                                                                    By {attendee.creator.name}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>

                                                    {/* Status */}
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        {attendee.status === 'called' || attendee.is_announced ? (
                                                            <Badge variant="default" className="gap-1 bg-green-600 text-white font-semibold text-xs">
                                                                <Check className="size-3" />
                                                                <span>Called</span>
                                                            </Badge>
                                                        ) : attendee.status === 'invited' ? (
                                                            <Badge variant="outline" className="border-blue-500/40 bg-blue-500/10 text-blue-700 dark:text-blue-300 font-semibold text-xs">
                                                                Invited
                                                            </Badge>
                                                        ) : (
                                                            <Badge variant="outline" className="border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300 font-semibold text-xs">
                                                                Registered
                                                            </Badge>
                                                        )}
                                                    </td>

                                                    {/* Actions */}
                                                    <td className="px-6 py-4 text-right whitespace-nowrap">
                                                        <div className="flex items-center justify-end gap-1.5">
                                                            <Button
                                                                variant="outline"
                                                                size="icon"
                                                                disabled={isCalled}
                                                                onClick={() => handleEditAttendee(attendee)}
                                                                className={cn(
                                                                    "size-8 border-neutral-300 text-neutral-700 hover:border-primary hover:text-primary dark:border-neutral-700 dark:text-neutral-300 dark:hover:border-primary",
                                                                    isCalled && "opacity-40 cursor-not-allowed hover:border-neutral-300 hover:text-neutral-700 dark:hover:border-neutral-700 dark:hover:text-neutral-300"
                                                                )}
                                                                title={isCalled ? "Cannot update a called guest. Undo call first." : `Update details for ${attendee.name || attendee.fullname}`}
                                                                aria-label={isCalled ? "Cannot update a called guest" : `Update details for ${attendee.name || attendee.fullname}`}
                                                            >
                                                                <Pencil className="size-4" />
                                                            </Button>

                                                            {attendee.status === 'called' || attendee.is_announced ? (
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    onClick={() => handleUnannounce(attendee.id)}
                                                                    className="size-8 text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100"
                                                                    title="Undo Call"
                                                                    aria-label="Undo Call"
                                                                >
                                                                    <RotateCcw className="size-4" />
                                                                </Button>
                                                            ) : (
                                                                <Button
                                                                    variant="default"
                                                                    size="icon"
                                                                    onClick={() => handleAnnounce(attendee.id)}
                                                                    className="size-8 font-semibold"
                                                                    title="Call Guest"
                                                                    aria-label="Call Guest"
                                                                >
                                                                    <Megaphone className="size-4" />
                                                                </Button>
                                                            )}

                                                            <Button
                                                                variant="outline"
                                                                size="icon"
                                                                disabled={isCalled}
                                                                onClick={() => handleDelete(attendee)}
                                                                className={cn(
                                                                    "size-8 border-neutral-300 text-red-600 hover:border-red-400 hover:bg-red-50 hover:text-red-700 dark:border-neutral-700 dark:text-red-400 dark:hover:bg-red-950/40",
                                                                    isCalled && "opacity-40 cursor-not-allowed hover:border-neutral-300 hover:bg-transparent hover:text-red-600 dark:hover:border-neutral-700 dark:hover:bg-transparent dark:hover:text-red-400"
                                                                )}
                                                                title={isCalled ? "Cannot delete a called guest. Undo call first." : `Delete ${attendee.name || attendee.fullname}`}
                                                                aria-label={isCalled ? "Cannot delete a called guest" : `Delete ${attendee.name || attendee.fullname}`}
                                                            >
                                                                <Trash2 className="size-4" />
                                                            </Button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Card UI (Visible on screens < md) - A Card UI for every attendee row */}
                        <div className="block md:hidden p-3.5 space-y-3 bg-neutral-50/70 dark:bg-neutral-950/40">
                            {attendees.data.length === 0 ? (
                                <div className="rounded-xl border border-neutral-200 bg-white p-8 text-center text-sm text-muted-foreground shadow-2xs dark:border-neutral-800 dark:bg-neutral-900">
                                    No attendance records found.
                                </div>
                            ) : (
                                attendees.data.map((attendee) => {
                                    const { date, time } = formatRegistrationDate(attendee.created_at);
                                    const categoryOrder = categories?.find((c) => c.id === attendee.category_id)?.order ?? attendee.category?.order;
                                    const isAlreadyAnnounced = attendee.status === 'called' || attendee.is_announced;

                                    return (
                                        <div
                                            key={attendee.id}
                                            className="rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-xs dark:border-neutral-800 dark:bg-neutral-900 space-y-3"
                                        >
                                            {/* 1. Category & Status Badges (Copied from /host modal called) */}
                                            <div className="flex flex-wrap items-center gap-1.5">
                                                {/* Category Badge */}
                                                <Badge
                                                    variant="outline"
                                                    className={cn(
                                                        'px-3 py-0.5 text-xs font-bold tracking-wide uppercase',
                                                        getCategoryBadgeClass(attendee.category?.slug)
                                                    )}
                                                >
                                                    {attendee.category?.name || 'Guest Official'}
                                                </Badge>

                                                {/* Protocol Order Badge */}
                                                {categoryOrder != null && (
                                                    <span className="inline-flex items-center gap-1 rounded-md bg-neutral-100 px-2 py-0.5 text-[11px] font-semibold text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
                                                        <Crown className="size-3 text-amber-500" />
                                                        <span>Protocol Order #{categoryOrder}</span>
                                                    </span>
                                                )}

                                                {/* Status Badge: Already Called / Invited / Registered */}
                                                {isAlreadyAnnounced ? (
                                                    <Badge className="bg-emerald-600 text-white font-bold gap-1 text-xs">
                                                        <CheckCircle2 className="size-3.5" />
                                                        <span>Already Called</span>
                                                    </Badge>
                                                ) : attendee.status === 'invited' ? (
                                                    <Badge variant="outline" className="border-blue-500/40 bg-blue-500/10 text-blue-700 dark:text-blue-300 font-semibold text-xs">
                                                        Invited
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="outline" className="border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300 font-semibold text-xs">
                                                        Registered
                                                    </Badge>
                                                )}

                                                {/* Attendance Mode: In Person / Represented */}
                                                {attendee.is_attending !== false ? (
                                                    <Badge variant="outline" className="border-green-500/30 bg-green-500/10 text-green-700 dark:text-green-300 text-xs font-semibold gap-1">
                                                        <UserCheck className="size-3.5" />
                                                        <span>In Person</span>
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300 text-xs font-semibold gap-1">
                                                        <Users className="size-3.5" />
                                                        <span>Represented</span>
                                                    </Badge>
                                                )}
                                            </div>

                                            {/* 2. Guest Full Name & Prefix */}
                                            <h3 className="text-xl font-black tracking-tight text-neutral-900 dark:text-white leading-tight">
                                                {attendee.prefix_name ? `${attendee.prefix_name} ` : ''}
                                                {attendee.fullname || attendee.name}
                                            </h3>

                                            {/* 3. Official Position / Designation concatenated with jurisdiction */}
                                            <div className="text-sm font-bold text-neutral-700 dark:text-neutral-300">
                                                {getAttendeePositionWithJurisdiction(attendee)}
                                            </div>

                                            {/* 4. Representative Information Callout (when sending representative) */}
                                            {!attendee.is_attending && attendee.rep_fullname && (
                                                <div className="rounded-xl border border-amber-400/40 bg-amber-500/10 p-3.5 dark:border-amber-500/30">
                                                    <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300">
                                                        <Users className="size-3.5" />
                                                        <span>REPRESENTED BY</span>
                                                    </div>
                                                    <div className="mt-1 text-base font-bold text-amber-950 dark:text-amber-200">
                                                        {attendee.rep_prefix_name ? `${attendee.rep_prefix_name} ` : ''}
                                                        {attendee.rep_fullname}
                                                    </div>
                                                    {attendee.rep_position && (
                                                        <div className="text-xs font-semibold text-amber-900/80 dark:text-amber-300/90 mt-0.5">
                                                            {attendee.rep_position}
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {/* 5. Footer: Registration Timestamp & Action Buttons */}
                                            <div className="pt-2.5 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between gap-2">
                                                <div className="flex items-center gap-1 text-[11px] text-neutral-500 dark:text-neutral-400">
                                                    <Clock className="size-3.5 text-neutral-400 shrink-0" />
                                                    <span>{date} {time}</span>
                                                    {attendee.creator?.name && (
                                                        <span className="truncate max-w-[120px] hidden sm:inline">• By {attendee.creator.name}</span>
                                                    )}
                                                </div>

                                                <div className="flex items-center gap-1.5">
                                                    <Button
                                                        variant="outline"
                                                        size="icon"
                                                        disabled={isAlreadyAnnounced}
                                                        onClick={() => handleEditAttendee(attendee)}
                                                        className={cn(
                                                            "size-8.5 border-neutral-300 text-neutral-700 dark:border-neutral-700 dark:text-neutral-300",
                                                            isAlreadyAnnounced && "opacity-40 cursor-not-allowed hover:border-neutral-300 hover:text-neutral-700 dark:hover:border-neutral-700 dark:hover:text-neutral-300"
                                                        )}
                                                        title={isAlreadyAnnounced ? "Cannot update a called guest. Undo call first." : `Update details for ${attendee.name || attendee.fullname}`}
                                                        aria-label={isAlreadyAnnounced ? "Cannot update a called guest" : `Update details for ${attendee.name || attendee.fullname}`}
                                                    >
                                                        <Pencil className="size-4" />
                                                    </Button>
                                                    {isAlreadyAnnounced ? (
                                                        <Button
                                                            variant="outline"
                                                            size="icon"
                                                            onClick={() => handleUnannounce(attendee.id)}
                                                            className="size-8.5 text-neutral-600 dark:text-neutral-300 border-neutral-300 dark:border-neutral-700"
                                                            title="Undo Call"
                                                            aria-label="Undo Call"
                                                        >
                                                            <RotateCcw className="size-4" />
                                                        </Button>
                                                    ) : (
                                                        <Button
                                                            variant="default"
                                                            size="icon"
                                                            onClick={() => handleAnnounce(attendee.id)}
                                                            className="size-8.5"
                                                            title="Call Guest"
                                                            aria-label="Call Guest"
                                                        >
                                                            <Megaphone className="size-4" />
                                                        </Button>
                                                    )}
                                                    <Button
                                                        variant="outline"
                                                        size="icon"
                                                        disabled={isAlreadyAnnounced}
                                                        onClick={() => handleDelete(attendee)}
                                                        className={cn(
                                                            "size-8.5 border-neutral-300 text-red-600 hover:border-red-400 hover:bg-red-50 hover:text-red-700 dark:border-neutral-700 dark:text-red-400 dark:hover:bg-red-950/40",
                                                            isAlreadyAnnounced && "opacity-40 cursor-not-allowed hover:border-neutral-300 hover:bg-transparent hover:text-red-600 dark:hover:border-neutral-700 dark:hover:bg-transparent dark:hover:text-red-400"
                                                        )}
                                                        title={isAlreadyAnnounced ? "Cannot delete a called guest. Undo call first." : `Delete ${attendee.name || attendee.fullname}`}
                                                        aria-label={isAlreadyAnnounced ? "Cannot delete a called guest" : `Delete ${attendee.name || attendee.fullname}`}
                                                    >
                                                        <Trash2 className="size-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {/* Pagination Bar & Records Per Page */}
                        <div className="flex flex-col gap-3 border-t border-neutral-200 px-6 py-3.5 sm:flex-row sm:items-center sm:justify-between dark:border-neutral-800">
                            {/* Left: Records info & Records Per Page */}
                            <div className="flex flex-wrap items-center gap-4 text-xs text-neutral-600 dark:text-neutral-400">
                                <div>
                                    Showing <span className="font-semibold text-neutral-900 dark:text-white">{attendees.from || (attendees.total > 0 ? 1 : 0)}</span> to{' '}
                                    <span className="font-semibold text-neutral-900 dark:text-white">{attendees.to || attendees.total}</span> of{' '}
                                    <span className="font-semibold text-neutral-900 dark:text-white">{attendees.total}</span> records
                                </div>

                                <div className="flex items-center gap-1.5">
                                    <span className="text-neutral-500">Records per page:</span>
                                    <select
                                        value={String(filters.per_page || '20')}
                                        onChange={(e) => handleFilterChange('per_page', e.target.value)}
                                        className="h-7.5 rounded-md border border-neutral-300 bg-white px-2 py-0.5 text-xs font-medium text-neutral-900 shadow-2xs focus:border-primary focus:outline-hidden focus:ring-1 focus:ring-primary dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
                                    >
                                        <option value="10">10</option>
                                        <option value="20">20</option>
                                        <option value="25">25</option>
                                        <option value="50">50</option>
                                        <option value="100">100</option>
                                        <option value="all">All</option>
                                    </select>
                                </div>
                            </div>

                            {/* Right: Pagination Navigation Links */}
                            {attendees.links && attendees.links.length > 3 && (
                                <div className="flex flex-wrap items-center gap-1">
                                    {attendees.links.map((link, idx) => (
                                        <button
                                            key={idx}
                                            disabled={!link.url}
                                            onClick={() => link.url && router.visit(link.url, { preserveState: true, preserveScroll: true })}
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                            className={`rounded-md px-2.5 py-1 text-xs transition-colors ${
                                                link.active
                                                    ? 'bg-primary font-bold text-primary-foreground shadow-xs'
                                                    : 'border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800'
                                            } ${!link.url ? 'opacity-40 cursor-not-allowed' : ''}`}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Register Guest Dialog */}
                <RegisterGuestDialog
                    open={isRegistering}
                    onOpenChange={setIsRegistering}
                    categories={categories}
                    provinces={provinces}
                    cities={cities}
                    events={events}
                    currentEvent={currentEvent}
                />

                {/* Update Attendee Dialog */}
                <UpdateAttendeeDialog
                    attendee={editingAttendee}
                    open={Boolean(editingAttendee)}
                    onOpenChange={(open) => {
                        if (!open) {
                            setEditingAttendee(null);
                        }
                    }}
                    categories={categories}
                    provinces={provinces}
                    cities={cities}
                    events={events}
                    currentEvent={currentEvent}
                />

                {/* Print Attendees Registry Modal */}
                <PrintAttendeesDialog
                    open={isPrintModalOpen}
                    onOpenChange={setIsPrintModalOpen}
                    events={events}
                    currentEvent={currentEvent}
                    categories={categories}
                    provinces={provinces}
                    cities={cities}
                    initialFilters={filters}
                />
            </div>
        </>
    );
}

AttendanceIndex.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Attendance Management', href: '/attendees' },
    ],
};

