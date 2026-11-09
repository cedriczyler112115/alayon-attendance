import {
    Calendar,
    Check,
    CheckCircle2,
    ChevronDown,
    Clock,
    FileSpreadsheet,
    FileText,
    Filter,
    Layers,
    MapPin,
    Maximize2,
    Printer,
    RefreshCw,
    RotateCcw,
    Search,
    SlidersHorizontal,
    Sparkles,
    UserCheck,
    Users,
    X,
} from 'lucide-react';
import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MultiSelect } from '@/components/ui/multi-select';
import { Select2 } from '@/components/ui/select2';
import { Spinner } from '@/components/ui/spinner';
import { Switch } from '@/components/ui/switch';
import { getCategoryCustomField } from '@/lib/category-custom-fields';
import { getAttendeePositionWithJurisdiction } from '@/lib/host-announcer-utils';
import { cn } from '@/lib/utils';
import type { Attendee, CityItem, EventItem, GuestCategory, ProvinceItem } from '@/types';

type AttendanceFilterMode = 'all' | 'without_rep' | 'with_rep';
type SortMode = 'protocol' | 'name_asc' | 'name_desc' | 'time_asc' | 'time_desc' | 'lgu';
type GroupMode = 'category' | 'province' | 'none';
type OrientationMode = 'portrait' | 'landscape';

type SummaryData = {
    total: number;
    in_person: number;
    represented: number;
    called: number;
    registered: number;
    invited: number;
};

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    events: { id: number; title: string; status?: string; event_date?: string }[];
    currentEvent?: EventItem | null;
    categories: GuestCategory[];
    provinces?: ProvinceItem[];
    cities?: CityItem[];
    initialFilters?: {
        event_id?: string | number;
        category_id?: string | number;
        category_ids?: (string | number)[] | string;
        status?: string;
        search?: string;
        attendance_mode?: string;
        province_id?: string | number;
        city_id?: string | number;
    };
};

function formatTime(dateString?: string | null): string {
    if (!dateString) return '—';
    try {
        const d = new Date(dateString);
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
        return dateString;
    }
}

function formatDateFull(dateString?: string | null): string {
    if (!dateString) return '';
    try {
        const d = new Date(dateString);
        return d.toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
        });
    } catch {
        return dateString;
    }
}

export function PrintAttendeesDialog({
    open,
    onOpenChange,
    events = [],
    currentEvent,
    categories = [],
    provinces = [],
    cities = [],
    initialFilters = {},
}: Props) {
    const parseInitialCategoryIds = (filters?: Props['initialFilters']): (string | number)[] => {
        if (!filters) return [];
        if (Array.isArray(filters.category_ids)) return filters.category_ids;
        if (typeof filters.category_ids === 'string' && filters.category_ids.trim()) {
            return filters.category_ids.split(',').filter(Boolean);
        }
        if (filters.category_id) {
            return [filters.category_id];
        }
        return [];
    };

    // Filter States
    const [eventId, setEventId] = useState<string | number>(
        initialFilters.event_id || currentEvent?.id || ''
    );
    const [categoryIds, setCategoryIds] = useState<(string | number)[]>(() =>
        parseInitialCategoryIds(initialFilters)
    );
    const [attendanceMode, setAttendanceMode] = useState<AttendanceFilterMode>(
        (initialFilters.attendance_mode as AttendanceFilterMode) || 'all'
    );
    const status = 'invited';
    const [provinceId, setProvinceId] = useState<string | number>(
        initialFilters.province_id || ''
    );
    const [cityId, setCityId] = useState<string | number>(
        initialFilters.city_id || ''
    );
    const [search, setSearch] = useState<string>(initialFilters.search || '');

    // Organization & Sorting
    const [sortBy, setSortBy] = useState<SortMode>('protocol');
    const [groupBy, setGroupBy] = useState<GroupMode>('category');

    // Print Layout Customizations
    const [orientation, setOrientation] = useState<OrientationMode>('landscape');
    const [showSignatureColumn, setShowSignatureColumn] = useState<boolean>(true);
    const [showAgency, setShowAgency] = useState<boolean>(true);
    const [showRegisteredTime, setShowRegisteredTime] = useState<boolean>(true);
    const [showStatus, setShowStatus] = useState<boolean>(true);
    const [showSummaryStats, setShowSummaryStats] = useState<boolean>(true);
    const [showSignatories, setShowSignatories] = useState<boolean>(true);
    const [preparedByName, setPreparedByName] = useState<string>('Secretariat Committee');
    const [verifiedByName, setVerifiedByName] = useState<string>('Registration Head');
    const [notedByName, setNotedByName] = useState<string>('Event Directorate / Chair');

    // UI View State
    const [isOptionsExpanded, setIsOptionsExpanded] = useState<boolean>(false);
    const [isPrinting, setIsPrinting] = useState<boolean>(false);

    // Data State
    const [loading, setLoading] = useState<boolean>(false);
    const [attendees, setAttendees] = useState<Attendee[]>([]);
    const [summary, setSummary] = useState<SummaryData>({
        total: 0,
        in_person: 0,
        represented: 0,
        called: 0,
        registered: 0,
        invited: 0,
    });
    const [resolvedEvent, setResolvedEvent] = useState<EventItem | null>(currentEvent || null);

    // Synchronize filters when modal opens or initialFilters change
    useEffect(() => {
        if (open) {
            setEventId(initialFilters.event_id || currentEvent?.id || '');
            setCategoryIds(parseInitialCategoryIds(initialFilters));
            setAttendanceMode((initialFilters.attendance_mode as AttendanceFilterMode) || 'all');
            setProvinceId(initialFilters.province_id || '');
            setCityId(initialFilters.city_id || '');
            setSearch(initialFilters.search || '');
        }
    }, [open, initialFilters, currentEvent]);

    // Available cities filtered by selected province
    const availableCities = useMemo(() => {
        if (!provinceId) return cities;
        return cities.filter((c) => String(c.prov_code) === String(provinceId));
    }, [cities, provinceId]);

    // Reset city when province changes if not matching
    const handleProvinceChange = (newProvId: string | number) => {
        setProvinceId(newProvId);
        if (cityId) {
            const stillValid = cities.some(
                (c) => String(c.prov_code) === String(newProvId) && String(c.city_code) === String(cityId)
            );
            if (!stillValid) {
                setCityId('');
            }
        }
    };

    // Reset all filters to defaults
    const handleResetFilters = () => {
        setEventId(currentEvent?.id || '');
        setCategoryIds([]);
        setAttendanceMode('all');
        setProvinceId('');
        setCityId('');
        setSearch('');
        setSortBy('protocol');
        setGroupBy('category');
    };

    // Fetch printable data from the backend
    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (eventId) params.set('event_id', String(eventId));
            if (categoryIds.length > 0) {
                params.set('category_ids', categoryIds.join(','));
            }
            if (attendanceMode && attendanceMode !== 'all') {
                params.set('attendance_mode', attendanceMode);
            }
            if (status) params.set('status', status);
            if (provinceId) params.set('province_id', String(provinceId));
            if (cityId) params.set('city_id', String(cityId));
            if (search.trim()) params.set('search', search.trim());
            if (sortBy) params.set('sort_by', sortBy);

            const res = await fetch(`/attendees/print-data?${params.toString()}`, {
                headers: {
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });

            if (!res.ok) {
                throw new Error(`Server returned ${res.status}`);
            }

            const data = await res.json();
            setAttendees(data.attendees || []);
            setSummary(
                data.summary || {
                    total: 0,
                    in_person: 0,
                    represented: 0,
                    called: 0,
                    registered: 0,
                    invited: 0,
                }
            );
            if (data.event) {
                setResolvedEvent(data.event);
            }
        } catch (err) {
            console.error('Failed to fetch print data:', err);
            toast.error('Failed to load attendee print records.');
        } finally {
            setLoading(false);
        }
    }, [eventId, categoryIds, attendanceMode, status, provinceId, cityId, search, sortBy]);

    // Fetch when modal is open and filters change (debouncing search)
    useEffect(() => {
        if (!open) return;
        const timer = setTimeout(() => {
            fetchData();
        }, 150);
        return () => clearTimeout(timer);
    }, [open, fetchData]);

    // Grouping computation for rendering and printout
    const groupedAttendees = useMemo(() => {
        if (groupBy === 'none') {
            return [{ groupKey: 'all', groupTitle: 'All Attendees', list: attendees }];
        }

        if (groupBy === 'category') {
            const groups: { groupKey: string; groupTitle: string; list: Attendee[]; order: number }[] = [];
            const map = new Map<string, Attendee[]>();

            for (const att of attendees) {
                const key = att.category?.name || 'Unassigned Category';
                if (!map.has(key)) map.set(key, []);
                map.get(key)!.push(att);
            }

            // Order according to categories order if available
            map.forEach((list, key) => {
                const catObj = categories.find((c) => c.name === key);
                groups.push({
                    groupKey: key,
                    groupTitle: key,
                    list,
                    order: catObj?.order ?? 999,
                });
            });

            groups.sort((a, b) => a.order - b.order);
            return groups;
        }

        if (groupBy === 'province') {
            const groups: { groupKey: string; groupTitle: string; list: Attendee[] }[] = [];
            const map = new Map<string, Attendee[]>();

            for (const att of attendees) {
                const key = att.province?.prov_name || 'No Province Specified';
                if (!map.has(key)) map.set(key, []);
                map.get(key)!.push(att);
            }

            map.forEach((list, key) => {
                groups.push({
                    groupKey: key,
                    groupTitle: key,
                    list,
                });
            });

            groups.sort((a, b) => a.groupTitle.localeCompare(b.groupTitle));
            return groups;
        }

        return [{ groupKey: 'all', groupTitle: 'All Attendees', list: attendees }];
    }, [attendees, groupBy, categories]);

    // Reference to the preview DOM element
    const previewContainerRef = useRef<HTMLDivElement>(null);

    // Pleasing UI Print Execution Engine
    const handlePrint = () => {
        if (!previewContainerRef.current) return;
        setIsPrinting(true);

        const printContent = previewContainerRef.current.innerHTML;

        const iframe = document.createElement('iframe');
        iframe.style.position = 'fixed';
        iframe.style.right = '0';
        iframe.style.bottom = '0';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.style.border = '0';
        document.body.appendChild(iframe);

        const doc = iframe.contentWindow?.document;
        if (!doc) {
            window.print();
            setIsPrinting(false);
            return;
        }

        const pageOrientation = orientation === 'landscape' ? 'landscape' : 'portrait';

        doc.open();
        doc.write(`
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="utf-8" />
                <title>${resolvedEvent?.title || 'Attendee Registry'} - Print Report</title>
                <style>
                    @page {
                        size: ${pageOrientation};
                        margin: 10mm 8mm 10mm 8mm;
                    }
                    * {
                        box-sizing: border-box;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    body {
                        margin: 0;
                        padding: 0;
                        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
                        color: #111827;
                        background: #ffffff;
                        font-size: 11px;
                        line-height: 1.35;
                    }
                    .print-header {
                        text-align: center;
                        border-bottom: 2px solid #111827;
                        padding-bottom: 12px;
                        margin-bottom: 12px;
                    }
                    .print-rep-name {
                        font-size: 10px;
                        text-transform: uppercase;
                        letter-spacing: 0.1em;
                        color: #4b5563;
                        margin-bottom: 2px;
                    }
                    .print-sys-title {
                        font-size: 12px;
                        font-weight: 700;
                        text-transform: uppercase;
                        letter-spacing: 0.05em;
                        color: #1f2937;
                        margin-bottom: 4px;
                    }
                    .print-event-title {
                        font-size: 17px;
                        font-weight: 800;
                        color: #111827;
                        margin: 4px 0;
                    }
                    .print-event-theme {
                        font-size: 11px;
                        font-style: italic;
                        color: #4b5563;
                        max-width: 80%;
                        margin: 2px auto;
                    }
                    .print-event-meta {
                        font-size: 10.5px;
                        color: #374151;
                        margin-top: 4px;
                    }
                    .print-summary-bar {
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        background: #f9fafb;
                        border: 1px solid #e5e7eb;
                        border-radius: 4px;
                        padding: 6px 12px;
                        margin-bottom: 12px;
                        font-size: 10.5px;
                    }
                    .print-summary-item {
                        display: flex;
                        gap: 4px;
                    }
                    .print-summary-item strong {
                        color: #111827;
                    }
                    .print-section-header {
                        background: #f3f4f6;
                        border: 1px solid #d1d5db;
                        border-bottom: none;
                        padding: 6px 10px;
                        font-size: 11.5px;
                        font-weight: 700;
                        text-transform: uppercase;
                        color: #1f2937;
                        margin-top: 14px;
                        display: flex;
                        justify-content: space-between;
                        page-break-after: avoid;
                        break-after: avoid;
                    }
                    table.print-table {
                        width: 100%;
                        border-collapse: collapse;
                        font-size: 10.5px;
                        margin-bottom: 12px;
                    }
                    table.print-table th {
                        background: #f9fafb;
                        color: #374151;
                        font-weight: 700;
                        text-transform: uppercase;
                        font-size: 9.5px;
                        letter-spacing: 0.04em;
                        border: 1px solid #d1d5db;
                        padding: 6px 8px;
                        text-align: left;
                    }
                    table.print-table td {
                        border: 1px solid #e5e7eb;
                        padding: 6px 8px;
                        vertical-align: top;
                    }
                    table.print-table tr:nth-child(even) td {
                        background-color: #fafafa;
                    }
                    tr {
                        page-break-inside: avoid;
                        break-inside: avoid;
                    }
                    thead {
                        display: table-header-group;
                    }
                    tfoot {
                        display: table-footer-group;
                    }
                    .badge-in-person {
                        display: inline-block;
                        padding: 1px 6px;
                        border-radius: 3px;
                        background: #ecfdf5;
                        color: #065f46;
                        border: 1px solid #a7f3d0;
                        font-size: 9.5px;
                        font-weight: 600;
                    }
                    .badge-represented {
                        display: inline-block;
                        padding: 1px 6px;
                        border-radius: 3px;
                        background: #fffbeb;
                        color: #92400e;
                        border: 1px solid #fde68a;
                        font-size: 9.5px;
                        font-weight: 600;
                    }
                    .badge-status {
                        display: inline-block;
                        padding: 1px 5px;
                        border-radius: 3px;
                        border: 1px solid #d1d5db;
                        font-size: 9px;
                        font-weight: 600;
                        text-transform: capitalize;
                    }
                    .badge-status-called {
                        background: #eff6ff;
                        color: #1e40af;
                        border-color: #bfdbfe;
                    }
                    .badge-status-registered {
                        background: #f0fdf4;
                        color: #166534;
                        border-color: #bbf7d0;
                    }
                    .badge-status-invited {
                        background: #fefce8;
                        color: #854d0e;
                        border-color: #fef08a;
                    }
                    .signature-line {
                        border-bottom: 1px solid #9ca3af;
                        width: 100%;
                        min-width: 90px;
                        height: 18px;
                        margin-top: 4px;
                    }
                    .print-signatories {
                        margin-top: 24px;
                        display: flex;
                        justify-content: space-between;
                        gap: 20px;
                        page-break-inside: avoid;
                        break-inside: avoid;
                    }
                    .signatory-box {
                        flex: 1;
                        text-align: center;
                    }
                    .signatory-line {
                        border-bottom: 1px solid #111827;
                        margin: 28px 10px 4px 10px;
                    }
                    .signatory-name {
                        font-weight: 700;
                        font-size: 11px;
                        color: #111827;
                    }
                    .signatory-role {
                        font-size: 9.5px;
                        color: #4b5563;
                    }
                    .print-footer {
                        margin-top: 16px;
                        padding-top: 8px;
                        border-top: 1px solid #e5e7eb;
                        display: flex;
                        justify-content: space-between;
                        font-size: 9px;
                        color: #6b7280;
                    }
                </style>
            </head>
            <body>
                ${printContent}
            </body>
            </html>
        `);
        doc.close();

        setTimeout(() => {
            iframe.contentWindow?.focus();
            iframe.contentWindow?.print();
            setTimeout(() => {
                if (document.body.contains(iframe)) {
                    document.body.removeChild(iframe);
                }
                setIsPrinting(false);
            }, 2000);
        }, 400);

        toast.success('Document dispatched to printer dialog!');
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[96vw] xl:max-w-7xl h-[92vh] max-h-[92vh] p-0 flex flex-col gap-0 overflow-hidden bg-neutral-100 dark:bg-neutral-950">
                {/* Modal Top Header Bar */}
                <DialogHeader className="px-6 py-4 border-b border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900 shrink-0">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-2.5">
                            <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary dark:bg-primary/20">
                                <Printer className="size-5" />
                            </div>
                            <div>
                                <DialogTitle className="text-base sm:text-lg font-bold">
                                    Print Attendees & Guest Registry
                                </DialogTitle>
                                <DialogDescription className="text-xs text-neutral-500">
                                    Filter and customize official attendance printouts with pleasing layout
                                </DialogDescription>
                            </div>
                        </div>

                        {/* Quick Header Actions */}
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleResetFilters}
                                className="h-8 gap-1.5 text-xs"
                                title="Reset all filters to default"
                            >
                                <RotateCcw className="size-3.5" />
                                <span className="hidden sm:inline">Reset</span>
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={fetchData}
                                disabled={loading}
                                className="h-8 gap-1.5 text-xs"
                                title="Refresh report preview"
                            >
                                <RefreshCw className={cn('size-3.5', loading && 'animate-spin')} />
                                <span className="hidden sm:inline">Refresh</span>
                            </Button>
                            <Button
                                size="sm"
                                onClick={handlePrint}
                                disabled={loading || attendees.length === 0 || isPrinting}
                                className="h-8 gap-1.5 font-bold shadow-xs px-4"
                            >
                                <Printer className="size-4" />
                                <span>Print Report</span>
                            </Button>
                        </div>
                    </div>
                </DialogHeader>

                {/* Modal Split View (Filters Sidebar + Live Print Preview) */}
                <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
                    {/* Left Sidebar: Filter Controls & Customization */}
                    <div className="w-full lg:w-[360px] xl:w-[400px] border-b lg:border-b-0 lg:border-r border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/90 flex flex-col shrink-0 overflow-y-auto">
                        <div className="p-4 sm:p-5 flex flex-col gap-4">
                            {/* Section Header */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-800 dark:text-neutral-200 uppercase tracking-wide">
                                    <Filter className="size-3.5 text-primary" />
                                    <span>Registry Data Filters</span>
                                </div>
                                <span className="text-[11px] font-medium text-muted-foreground">
                                    {attendees.length} record{attendees.length === 1 ? '' : 's'} matching
                                </span>
                            </div>

                            {/* 1. Event Selector */}
                            <div className="flex flex-col gap-1.5">
                                <Label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                                    Event Selection
                                </Label>
                                <Select2
                                    value={eventId || ''}
                                    onChange={(val) => setEventId(String(val))}
                                    options={[
                                        { value: '', label: 'All Events (Across Entire System)' },
                                        ...events.map((e) => ({
                                            value: e.id,
                                            label: e.title,
                                            description: e.event_date ? formatDateFull(e.event_date) : undefined,
                                        })),
                                    ]}
                                    placeholder="Select an Event..."
                                    searchPlaceholder="Search event..."
                                    clearable={Boolean(eventId)}
                                />
                            </div>

                            {/* 2. ATTENDANCE & REPRESENTATIVE FILTER (Core Requirement!) */}
                            <div className="flex flex-col gap-1.5 rounded-lg border border-primary/20 bg-primary/5 p-3 dark:border-primary/30 dark:bg-primary/10">
                                <div className="flex items-center justify-between">
                                    <Label className="text-xs font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
                                        <Users className="size-3.5 text-primary" />
                                        <span>Attendance & Representative</span>
                                    </Label>
                                    <Badge variant="outline" className="text-[10px] bg-white dark:bg-neutral-800">
                                        Required Filter
                                    </Badge>
                                </div>
                                <p className="text-[11px] text-neutral-600 dark:text-neutral-400">
                                    Filter by guest attending personally or with designated representative
                                </p>
                                <div className="grid grid-cols-1 gap-1.5 pt-1">
                                    <button
                                        type="button"
                                        onClick={() => setAttendanceMode('all')}
                                        className={cn(
                                            'flex items-center justify-between rounded-md border px-3 py-2 text-xs font-medium transition-all text-left',
                                            attendanceMode === 'all'
                                                ? 'border-primary bg-primary text-primary-foreground shadow-xs font-bold'
                                                : 'border-neutral-200 bg-white hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-800 dark:hover:bg-neutral-700'
                                        )}
                                    >
                                        <div className="flex items-center gap-2">
                                            <Users className="size-3.5" />
                                            <span>All Attending Guests</span>
                                        </div>
                                        <span className="text-[10px] opacity-80">
                                            {summary.total} total
                                        </span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setAttendanceMode('without_rep')}
                                        className={cn(
                                            'flex items-center justify-between rounded-md border px-3 py-2 text-xs font-medium transition-all text-left',
                                            attendanceMode === 'without_rep'
                                                ? 'border-emerald-600 bg-emerald-600 text-white shadow-xs font-bold'
                                                : 'border-neutral-200 bg-white hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-800 dark:hover:bg-neutral-700'
                                        )}
                                    >
                                        <div className="flex items-center gap-2">
                                            <UserCheck className="size-3.5 text-emerald-500" />
                                            <span>Attending in Person (Without Representative)</span>
                                        </div>
                                        <span className="text-[10px] opacity-80">
                                            {summary.in_person}
                                        </span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setAttendanceMode('with_rep')}
                                        className={cn(
                                            'flex items-center justify-between rounded-md border px-3 py-2 text-xs font-medium transition-all text-left',
                                            attendanceMode === 'with_rep'
                                                ? 'border-amber-600 bg-amber-600 text-white shadow-xs font-bold'
                                                : 'border-neutral-200 bg-white hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-800 dark:hover:bg-neutral-700'
                                        )}
                                    >
                                        <div className="flex items-center gap-2">
                                            <Users className="size-3.5 text-amber-500" />
                                            <span>Attending with Representative</span>
                                        </div>
                                        <span className="text-[10px] opacity-80">
                                            {summary.represented}
                                        </span>
                                    </button>
                                </div>
                            </div>

                            {/* 3. Category Multi-Select Filter */}
                            <div className="flex flex-col gap-1.5">
                                <div className="flex items-center justify-between">
                                    <Label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                                        Guest Categories (Multi-Select)
                                    </Label>
                                    {categoryIds.length > 0 && (
                                        <button
                                            type="button"
                                            onClick={() => setCategoryIds([])}
                                            className="text-[10px] text-primary hover:underline font-medium"
                                        >
                                            Clear all ({categoryIds.length})
                                        </button>
                                    )}
                                </div>
                                <MultiSelect
                                    value={categoryIds}
                                    onChange={setCategoryIds}
                                    options={categories.map((c) => ({
                                        value: c.id,
                                        label: c.name,
                                        badge: c.scope,
                                    }))}
                                    placeholder="All Categories (Select one or more)"
                                    searchPlaceholder="Search category..."
                                    allLabel="All Categories Selected"
                                    maxDisplayBadges={2}
                                />
                            </div>

                            {/* 4. Status Filter: Only Invited */}
                            <div className="flex flex-col gap-1.5">
                                <Label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                                    Registry Status
                                </Label>
                                <div className="flex h-9.5 items-center justify-between rounded-md border border-amber-500/30 bg-amber-500/5 px-3 text-xs dark:border-amber-500/30 dark:bg-amber-500/10">
                                    <div className="flex items-center gap-2">
                                        <span className="flex size-2 rounded-full bg-amber-500" />
                                        <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                                            Invited Status Only
                                        </span>
                                    </div>
                                    <Badge
                                        variant="outline"
                                        className="border-amber-500/40 bg-amber-500/15 text-amber-800 dark:text-amber-300 text-[10px] font-semibold"
                                    >
                                        Status = Invited
                                    </Badge>
                                </div>
                            </div>

                            {/* 5. Geographic (Province & City) Filters */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
                                <div className="flex flex-col gap-1.5">
                                    <Label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                                        Province (LGU)
                                    </Label>
                                    <Select2
                                        value={provinceId || ''}
                                        onChange={(val) => handleProvinceChange(String(val))}
                                        options={[
                                            { value: '', label: 'All Provinces' },
                                            ...provinces.map((p) => ({
                                                value: p.prov_code,
                                                label: p.prov_name,
                                            })),
                                        ]}
                                        placeholder="All Provinces"
                                        searchPlaceholder="Search province..."
                                        clearable={Boolean(provinceId)}
                                    />
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <Label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                                        City / Municipality
                                    </Label>
                                    <Select2
                                        value={cityId || ''}
                                        onChange={(val) => setCityId(String(val))}
                                        options={[
                                            { value: '', label: 'All Cities / Municipalities' },
                                            ...availableCities.map((c) => ({
                                                value: c.city_code,
                                                label: c.city_name,
                                            })),
                                        ]}
                                        placeholder="All Cities / Municipalities"
                                        searchPlaceholder="Search city / municipality..."
                                        clearable={Boolean(cityId)}
                                    />
                                </div>
                            </div>

                            {/* 6. Search Filter */}
                            <div className="flex flex-col gap-1.5">
                                <Label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                                    Search Keywords
                                </Label>
                                <div className="relative">
                                    <Search className="absolute left-2.5 top-2.5 size-3.5 text-neutral-400" />
                                    <Input
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        placeholder="Search by name, agency, rep..."
                                        className="h-8.5 pl-8 text-xs"
                                    />
                                    {search && (
                                        <button
                                            type="button"
                                            onClick={() => setSearch('')}
                                            className="absolute right-2.5 top-2.5 text-neutral-400 hover:text-neutral-700"
                                        >
                                            <X className="size-3.5" />
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* 7. Grouping & Sorting */}
                            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-neutral-100 dark:border-neutral-800">
                                <div className="flex flex-col gap-1">
                                    <Label className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-400">
                                        Group By
                                    </Label>
                                    <select
                                        value={groupBy}
                                        onChange={(e) => setGroupBy(e.target.value as GroupMode)}
                                        className="h-8 rounded-md border border-neutral-300 bg-white px-2 text-xs font-medium text-neutral-800 shadow-2xs dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200"
                                    >
                                        <option value="category">By Category</option>
                                        <option value="province">By Province</option>
                                        <option value="none">Continuous (Flat)</option>
                                    </select>
                                </div>

                                <div className="flex flex-col gap-1">
                                    <Label className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-400">
                                        Sort Order
                                    </Label>
                                    <select
                                        value={sortBy}
                                        onChange={(e) => setSortBy(e.target.value as SortMode)}
                                        className="h-8 rounded-md border border-neutral-300 bg-white px-2 text-xs font-medium text-neutral-800 shadow-2xs dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200"
                                    >
                                        <option value="protocol">Protocol Priority</option>
                                        <option value="name_asc">Name (A → Z)</option>
                                        <option value="name_desc">Name (Z → A)</option>
                                        <option value="time_asc">Arrival Time (FIFO)</option>
                                        <option value="time_desc">Registration (Latest)</option>
                                        <option value="lgu">LGU Location</option>
                                    </select>
                                </div>
                            </div>

                            {/* 8. Print Layout & Column Toggles (Expandable) */}
                            <div className="rounded-lg border border-neutral-200 bg-neutral-50/70 p-3 dark:border-neutral-800 dark:bg-neutral-800/40">
                                <button
                                    type="button"
                                    onClick={() => setIsOptionsExpanded(!isOptionsExpanded)}
                                    className="flex w-full items-center justify-between text-xs font-bold text-neutral-800 dark:text-neutral-200"
                                >
                                    <div className="flex items-center gap-1.5">
                                        <SlidersHorizontal className="size-3.5 text-primary" />
                                        <span>Print Columns & Format</span>
                                    </div>
                                    <ChevronDown
                                        className={cn(
                                            'size-4 text-neutral-400 transition-transform',
                                            isOptionsExpanded && 'rotate-180'
                                        )}
                                    />
                                </button>

                                {isOptionsExpanded && (
                                    <div className="mt-3 flex flex-col gap-2.5 pt-2 border-t border-neutral-200 dark:border-neutral-700 text-xs">
                                        {/* Paper Orientation */}
                                        <div className="flex items-center justify-between">
                                            <span className="text-neutral-600 dark:text-neutral-400 font-medium">
                                                Page Orientation
                                            </span>
                                            <div className="flex items-center gap-1 bg-neutral-200/70 dark:bg-neutral-800 rounded p-0.5">
                                                <button
                                                    type="button"
                                                    onClick={() => setOrientation('landscape')}
                                                    className={cn(
                                                        'px-2 py-0.5 text-[11px] rounded font-medium transition-colors',
                                                        orientation === 'landscape'
                                                            ? 'bg-white dark:bg-neutral-700 shadow-2xs font-bold text-neutral-900 dark:text-white'
                                                            : 'text-neutral-500'
                                                    )}
                                                >
                                                    Landscape
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setOrientation('portrait')}
                                                    className={cn(
                                                        'px-2 py-0.5 text-[11px] rounded font-medium transition-colors',
                                                        orientation === 'portrait'
                                                            ? 'bg-white dark:bg-neutral-700 shadow-2xs font-bold text-neutral-900 dark:text-white'
                                                            : 'text-neutral-500'
                                                    )}
                                                >
                                                    Portrait
                                                </button>
                                            </div>
                                        </div>

                                        {/* Signature Column */}
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <span className="font-semibold text-neutral-800 dark:text-neutral-200 block">
                                                    Include Signature Line
                                                </span>
                                                <span className="text-[10px] text-neutral-400">
                                                    Adds signature space for logbooks
                                                </span>
                                            </div>
                                            <Switch
                                                checked={showSignatureColumn}
                                                onCheckedChange={setShowSignatureColumn}
                                            />
                                        </div>

                                        {/* Agency / Office */}
                                        <div className="flex items-center justify-between">
                                            <span className="text-neutral-700 dark:text-neutral-300">
                                                Include Office / Agency Name
                                            </span>
                                            <Switch checked={showAgency} onCheckedChange={setShowAgency} />
                                        </div>

                                        {/* Registration Time */}
                                        <div className="flex items-center justify-between">
                                            <span className="text-neutral-700 dark:text-neutral-300">
                                                Include Registered Time
                                            </span>
                                            <Switch
                                                checked={showRegisteredTime}
                                                onCheckedChange={setShowRegisteredTime}
                                            />
                                        </div>

                                        {/* Status Column */}
                                        <div className="flex items-center justify-between">
                                            <span className="text-neutral-700 dark:text-neutral-300">
                                                Include Registry Status
                                            </span>
                                            <Switch checked={showStatus} onCheckedChange={setShowStatus} />
                                        </div>

                                        {/* Summary Stats Header */}
                                        <div className="flex items-center justify-between">
                                            <span className="text-neutral-700 dark:text-neutral-300">
                                                Include Summary Statistics Box
                                            </span>
                                            <Switch
                                                checked={showSummaryStats}
                                                onCheckedChange={setShowSummaryStats}
                                            />
                                        </div>

                                        {/* Signatories Section */}
                                        <div className="flex items-center justify-between">
                                            <span className="text-neutral-700 dark:text-neutral-300">
                                                Include Signatories Block
                                            </span>
                                            <Switch
                                                checked={showSignatories}
                                                onCheckedChange={setShowSignatories}
                                            />
                                        </div>

                                        {showSignatories && (
                                            <div className="flex flex-col gap-2 pt-2 border-t border-neutral-200 dark:border-neutral-700">
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-[10px] text-neutral-500 font-medium">
                                                        Prepared By Name
                                                    </span>
                                                    <Input
                                                        value={preparedByName}
                                                        onChange={(e) => setPreparedByName(e.target.value)}
                                                        className="h-7 text-xs"
                                                    />
                                                </div>
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-[10px] text-neutral-500 font-medium">
                                                        Verified By Name
                                                    </span>
                                                    <Input
                                                        value={verifiedByName}
                                                        onChange={(e) => setVerifiedByName(e.target.value)}
                                                        className="h-7 text-xs"
                                                    />
                                                </div>
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-[10px] text-neutral-500 font-medium">
                                                        Noted By Name
                                                    </span>
                                                    <Input
                                                        value={notedByName}
                                                        onChange={(e) => setNotedByName(e.target.value)}
                                                        className="h-7 text-xs"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Main Pane: Live Print Result Preview */}
                    <div className="flex-1 flex flex-col min-w-0 bg-neutral-200/70 dark:bg-neutral-950 overflow-hidden">
                        {/* Preview Top Control Bar */}
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-200 bg-white px-4 py-2.5 dark:border-neutral-800 dark:bg-neutral-900 shrink-0">
                            {/* Summary Pills */}
                            <div className="flex flex-wrap items-center gap-2 text-xs">
                                <Badge variant="secondary" className="font-semibold gap-1">
                                    <span>Total:</span>
                                    <span className="text-neutral-900 dark:text-white font-bold">
                                        {summary.total}
                                    </span>
                                </Badge>
                                <Badge
                                    variant="outline"
                                    className="border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-semibold gap-1"
                                >
                                    <UserCheck className="size-3 text-emerald-600" />
                                    <span>In Person: {summary.in_person}</span>
                                </Badge>
                                <Badge
                                    variant="outline"
                                    className="border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300 font-semibold gap-1"
                                >
                                    <Users className="size-3 text-amber-600" />
                                    <span>With Rep: {summary.represented}</span>
                                </Badge>
                                <Badge
                                    variant="outline"
                                    className="border-neutral-300 bg-neutral-50 text-neutral-600 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-400 font-semibold gap-1"
                                >
                                    <span>Status: Invited Only</span>
                                </Badge>
                            </div>

                            {/* View Indicators & Print Button */}
                            <div className="flex items-center gap-2">
                                <span className="text-[11px] text-muted-foreground hidden md:inline">
                                    Preview Mode: {orientation.toUpperCase()} ({groupBy === 'none' ? 'Continuous' : `Grouped by ${groupBy}`})
                                </span>
                                <Button
                                    size="sm"
                                    onClick={handlePrint}
                                    disabled={loading || attendees.length === 0 || isPrinting}
                                    className="gap-1.5 font-bold h-8 px-4 shadow-xs"
                                >
                                    <Printer className="size-3.5" />
                                    <span>Print Report</span>
                                </Button>
                            </div>
                        </div>

                        {/* Interactive Scrollable Canvas for the Document */}
                        <div className="flex-1 overflow-auto p-4 sm:p-6 flex justify-center">
                            {loading ? (
                                <div className="flex flex-col items-center justify-center p-12 text-neutral-500 gap-3">
                                    <Spinner className="size-8 text-primary" />
                                    <p className="text-xs font-semibold">Generating print layout preview...</p>
                                </div>
                            ) : attendees.length === 0 ? (
                                <div className="flex flex-col items-center justify-center p-12 text-center max-w-md my-auto rounded-xl border border-dashed border-neutral-300 bg-white p-8 dark:border-neutral-800 dark:bg-neutral-900">
                                    <Users className="size-10 text-neutral-300 mb-3" />
                                    <h4 className="text-sm font-bold text-neutral-800 dark:text-neutral-200">
                                        No Attendees Found
                                    </h4>
                                    <p className="text-xs text-neutral-500 mt-1">
                                        No attendees match the specified filter criteria. Try adjusting your
                                        filters or attendance mode.
                                    </p>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleResetFilters}
                                        className="mt-4 gap-1.5 text-xs"
                                    >
                                        <RotateCcw className="size-3.5" />
                                        <span>Reset Filters</span>
                                    </Button>
                                </div>
                            ) : (
                                /* ACTUAL PRINTABLE DOCUMENT SHEET */
                                <div
                                    id="printable-attendance-sheet"
                                    ref={previewContainerRef}
                                    className={cn(
                                        'bg-white text-neutral-900 shadow-md border border-neutral-300 rounded p-6 sm:p-8 text-xs font-sans transition-all',
                                        orientation === 'landscape'
                                            ? 'w-full max-w-[1100px]'
                                            : 'w-full max-w-[850px]'
                                    )}
                                    style={{
                                        color: '#111827',
                                        backgroundColor: '#ffffff',
                                    }}
                                >
                                    {/* Document Header */}
                                    <div className="print-header text-center border-b-2 border-neutral-900 pb-3 mb-4">
                                        <div className="text-[10px] uppercase tracking-widest text-neutral-500 font-semibold">
                                            Republic of the Philippines
                                        </div>
                                        <div className="text-xs font-bold uppercase tracking-wider text-neutral-800 mt-0.5">
                                            Alayon Stakeholders Attendance & Guest Registry System
                                        </div>
                                        <h1 className="text-lg sm:text-xl font-extrabold text-neutral-950 mt-1">
                                            {resolvedEvent?.title || 'Assembly & Stakeholders Meeting'}
                                        </h1>
                                        {resolvedEvent?.theme && (
                                            <p className="text-[11px] italic text-neutral-600 max-w-2xl mx-auto mt-0.5">
                                                &ldquo;{resolvedEvent.theme}&rdquo;
                                            </p>
                                        )}
                                        <div className="text-[10.5px] text-neutral-700 mt-1 flex flex-wrap items-center justify-center gap-x-3 gap-y-0.5">
                                            {resolvedEvent?.venue && (
                                                <span>
                                                    <strong>Venue:</strong> {resolvedEvent.venue}
                                                </span>
                                            )}
                                            {resolvedEvent?.event_date && (
                                                <span>
                                                    <strong>Date:</strong> {formatDateFull(resolvedEvent.event_date)}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Sub-Header / Active Filter Metadata Chip Bar */}
                                    <div className="print-summary-bar flex flex-wrap items-center justify-between bg-neutral-50 border border-neutral-200 rounded p-2.5 mb-3 text-[11px]">
                                        <div className="flex flex-wrap items-center gap-1.5">
                                            <span className="font-bold text-neutral-900 uppercase">
                                                Official Registry Report
                                            </span>
                                            <span className="text-neutral-400">•</span>
                                            <span className="text-neutral-600">
                                                Filter: {attendanceMode === 'all'
                                                    ? 'All Attendees'
                                                    : attendanceMode === 'without_rep'
                                                      ? 'In Person (Without Representative)'
                                                      : 'Attending with Representative'}
                                            </span>
                                            {categoryIds.length > 0 && (
                                                <>
                                                    <span className="text-neutral-400">•</span>
                                                    <span className="text-neutral-600">
                                                        Categories ({categoryIds.length}):{' '}
                                                        {categoryIds
                                                            .map((id) => categories.find((c) => String(c.id) === String(id))?.name || id)
                                                            .slice(0, 2)
                                                            .join(', ')}
                                                        {categoryIds.length > 2 ? ` (+${categoryIds.length - 2} more)` : ''}
                                                    </span>
                                                </>
                                            )}
                                            <span className="text-neutral-400">•</span>
                                            <span className="text-neutral-600">
                                                Status: Invited Guests Only
                                            </span>
                                        </div>
                                        <div className="text-[10.5px] text-neutral-500 font-medium">
                                            Generated on: {new Date().toLocaleString()}
                                        </div>
                                    </div>

                                    {/* Optional Summary Statistics Box */}
                                    {showSummaryStats && (
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-4">
                                            <div className="border border-neutral-200 bg-neutral-50/70 p-2 rounded text-center">
                                                <div className="text-[10px] uppercase font-bold text-neutral-500">
                                                    Total Invited Guests
                                                </div>
                                                <div className="text-base font-extrabold text-neutral-900">
                                                    {summary.total}
                                                </div>
                                            </div>
                                            <div className="border border-emerald-200 bg-emerald-50/50 p-2 rounded text-center">
                                                <div className="text-[10px] uppercase font-bold text-emerald-700">
                                                    In Person (Without Rep)
                                                </div>
                                                <div className="text-base font-extrabold text-emerald-800">
                                                    {summary.in_person}
                                                </div>
                                            </div>
                                            <div className="border border-amber-200 bg-amber-50/50 p-2 rounded text-center">
                                                <div className="text-[10px] uppercase font-bold text-amber-700">
                                                    With Representative
                                                </div>
                                                <div className="text-base font-extrabold text-amber-800">
                                                    {summary.represented}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Printable Tables (Grouped or Flat) */}
                                    {groupedAttendees.map((group, groupIdx) => {
                                        let runningNoOffset = 0;
                                        for (let i = 0; i < groupIdx; i++) {
                                            runningNoOffset += groupedAttendees[i].list.length;
                                        }

                                        return (
                                            <div key={group.groupKey} className="mb-4">
                                                {/* Group Title Banner */}
                                                {groupBy !== 'none' && (
                                                    <div className="print-section-header bg-neutral-100 border border-neutral-300 border-b-0 px-3 py-1.5 text-[11px] font-bold uppercase text-neutral-800 flex justify-between items-center">
                                                        <span>
                                                            {groupBy === 'category' ? 'Category: ' : 'Province: '}
                                                            {group.groupTitle}
                                                        </span>
                                                        <span className="text-[10px] font-semibold text-neutral-600">
                                                            {group.list.length} Attendee{group.list.length === 1 ? '' : 's'}
                                                        </span>
                                                    </div>
                                                )}

                                                {/* Attendees Table */}
                                                <table className="print-table w-full border-collapse border border-neutral-300 text-[10.5px]">
                                                    <thead>
                                                        <tr className="bg-neutral-50 text-neutral-700 uppercase font-bold text-[9.5px]">
                                                            <th className="border border-neutral-300 p-2 text-center w-8">
                                                                #
                                                            </th>
                                                            <th className="border border-neutral-300 p-2">
                                                                Guest Official Name
                                                            </th>
                                                            <th className="border border-neutral-300 p-2">
                                                                Official Designation / Agency
                                                            </th>
                                                            <th className="border border-neutral-300 p-2">
                                                                Attendance & Representative
                                                            </th>
                                                            <th className="border border-neutral-300 p-2">
                                                                Jurisdiction (LGU)
                                                            </th>
                                                            {showRegisteredTime && (
                                                                <th className="border border-neutral-300 p-2 w-20 whitespace-nowrap">
                                                                    Time
                                                                </th>
                                                            )}
                                                            {showStatus && (
                                                                <th className="border border-neutral-300 p-2 w-20 text-center">
                                                                    Status
                                                                </th>
                                                            )}
                                                            {showSignatureColumn && (
                                                                <th className="border border-neutral-300 p-2 w-32 text-center">
                                                                    Signature / Remarks
                                                                </th>
                                                            )}
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {group.list.map((attendee, index) => {
                                                            const itemNumber = runningNoOffset + index + 1;
                                                            const customField = getCategoryCustomField(attendee.category);
                                                            const isPersonallyAttending = attendee.is_attending !== false && !attendee.rep_fullname;

                                                            return (
                                                                <tr
                                                                    key={attendee.id}
                                                                    className={cn(
                                                                        'break-inside-avoid',
                                                                        index % 2 === 1 ? 'bg-neutral-50/60' : 'bg-white'
                                                                    )}
                                                                >
                                                                    {/* Row Number */}
                                                                    <td className="border border-neutral-200 p-2 text-center font-bold text-neutral-500">
                                                                        {itemNumber}
                                                                    </td>

                                                                    {/* Guest Official Name */}
                                                                    <td className="border border-neutral-200 p-2">
                                                                        <div className="font-bold text-neutral-900 text-xs">
                                                                            {attendee.prefix_name ? `${attendee.prefix_name} ` : ''}
                                                                            {attendee.fullname}
                                                                        </div>
                                                                        {groupBy !== 'category' && attendee.category && (
                                                                            <div className="text-[10px] text-neutral-500">
                                                                                {attendee.category.name}
                                                                            </div>
                                                                        )}
                                                                    </td>

                                                                    {/* Official Position & Agency */}
                                                                    <td className="border border-neutral-200 p-2">
                                                                        <div className="font-semibold text-neutral-800">
                                                                            {attendee.position || attendee.designation || '—'}
                                                                        </div>
                                                                        {showAgency && attendee.agency_name && (
                                                                            <div className="text-[10px] text-neutral-600 mt-0.5">
                                                                                {customField?.label ? `${customField.label}: ` : 'Office: '}
                                                                                <span className="font-medium text-neutral-800">
                                                                                    {attendee.agency_name}
                                                                                </span>
                                                                            </div>
                                                                        )}
                                                                    </td>

                                                                    {/* Attendance Mode & Representative */}
                                                                    <td className="border border-neutral-200 p-2">
                                                                        {isPersonallyAttending ? (
                                                                            <div className="flex flex-col gap-0.5">
                                                                                <span className="badge-in-person inline-flex items-center gap-1 font-semibold text-[9.5px]">
                                                                                    <UserCheck className="size-2.5" />
                                                                                    <span>In Person (Self)</span>
                                                                                </span>
                                                                                <span className="text-[9.5px] text-neutral-400">
                                                                                    Without representative
                                                                                </span>
                                                                            </div>
                                                                        ) : (
                                                                            <div className="flex flex-col gap-0.5">
                                                                                <span className="badge-represented inline-flex items-center gap-1 font-semibold text-[9.5px]">
                                                                                    <Users className="size-2.5" />
                                                                                    <span>Via Representative</span>
                                                                                </span>
                                                                                {attendee.rep_fullname ? (
                                                                                    <div className="mt-0.5">
                                                                                        <div className="font-bold text-neutral-900 text-[10.5px]">
                                                                                            {attendee.rep_prefix_name ? `${attendee.rep_prefix_name} ` : ''}
                                                                                            {attendee.rep_fullname}
                                                                                        </div>
                                                                                        {attendee.rep_position && (
                                                                                            <div className="text-[9.5px] text-neutral-500 italic">
                                                                                                {attendee.rep_position}
                                                                                            </div>
                                                                                        )}
                                                                                    </div>
                                                                                ) : (
                                                                                    <span className="text-[9.5px] text-neutral-400 italic">
                                                                                        Representative name not specified
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                        )}
                                                                    </td>

                                                                    {/* Jurisdiction / LGU */}
                                                                    <td className="border border-neutral-200 p-2">
                                                                        <div className="font-semibold text-neutral-900">
                                                                            {attendee.city?.city_name || attendee.province?.prov_name || '—'}
                                                                        </div>
                                                                        {attendee.city && attendee.province && (
                                                                            <div className="text-[10px] text-neutral-500">
                                                                                {attendee.province.prov_name}
                                                                            </div>
                                                                        )}
                                                                        {attendee.barangay && (
                                                                            <div className="text-[9px] text-neutral-400">
                                                                                Brgy. {attendee.barangay.brgy_name}
                                                                            </div>
                                                                        )}
                                                                    </td>

                                                                    {/* Registered Time */}
                                                                    {showRegisteredTime && (
                                                                        <td className="border border-neutral-200 p-2 whitespace-nowrap text-neutral-600">
                                                                            {formatTime(attendee.created_at)}
                                                                        </td>
                                                                    )}

                                                                    {/* Registry Status */}
                                                                    {showStatus && (
                                                                        <td className="border border-neutral-200 p-2 text-center">
                                                                            <span
                                                                                className={cn(
                                                                                    'badge-status',
                                                                                    attendee.status === 'called'
                                                                                        ? 'badge-status-called'
                                                                                        : attendee.status === 'registered'
                                                                                          ? 'badge-status-registered'
                                                                                          : 'badge-status-invited'
                                                                                )}
                                                                            >
                                                                                {attendee.status}
                                                                            </span>
                                                                        </td>
                                                                    )}

                                                                    {/* Signature Column */}
                                                                    {showSignatureColumn && (
                                                                        <td className="border border-neutral-200 p-2 text-center align-bottom">
                                                                            <div className="signature-line border-b border-neutral-400 w-full min-w-[100px] h-5 mt-1" />
                                                                        </td>
                                                                    )}
                                                                </tr>
                                                            );
                                                        })}
                                                    </tbody>
                                                </table>
                                            </div>
                                        );
                                    })}

                                    {/* Signatories Block */}
                                    {showSignatories && (
                                        <div className="print-signatories flex justify-between gap-6 mt-8 pt-4 page-break-inside-avoid">
                                            <div className="signatory-box flex-1 text-center">
                                                <div className="text-[10px] text-neutral-500 uppercase tracking-wider mb-8">
                                                    Prepared By:
                                                </div>
                                                <div className="border-b border-neutral-800 mx-4" />
                                                <div className="font-bold text-xs text-neutral-900 mt-1">
                                                    {preparedByName}
                                                </div>
                                                <div className="text-[9.5px] text-neutral-500">
                                                    Registration & Attendance Secretariat
                                                </div>
                                            </div>

                                            <div className="signatory-box flex-1 text-center">
                                                <div className="text-[10px] text-neutral-500 uppercase tracking-wider mb-8">
                                                    Verified By:
                                                </div>
                                                <div className="border-b border-neutral-800 mx-4" />
                                                <div className="font-bold text-xs text-neutral-900 mt-1">
                                                    {verifiedByName}
                                                </div>
                                                <div className="text-[9.5px] text-neutral-500">
                                                    Protocol & Event Coordinator
                                                </div>
                                            </div>

                                            <div className="signatory-box flex-1 text-center">
                                                <div className="text-[10px] text-neutral-500 uppercase tracking-wider mb-8">
                                                    Noted By:
                                                </div>
                                                <div className="border-b border-neutral-800 mx-4" />
                                                <div className="font-bold text-xs text-neutral-900 mt-1">
                                                    {notedByName}
                                                </div>
                                                <div className="text-[9.5px] text-neutral-500">
                                                    Head of Secretariat / Lead Directorate
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Document Footer */}
                                    <div className="print-footer flex justify-between items-center border-t border-neutral-200 mt-6 pt-2 text-[9px] text-neutral-400">
                                        <span>
                                            Alayon Stakeholders Attendance Registry • Official Event Record
                                        </span>
                                        <span>
                                            Printed: {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Modal Bottom Footer */}
                <DialogFooter className="px-6 py-3 border-t border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900 shrink-0 flex items-center justify-between sm:justify-between">
                    <div className="text-xs text-neutral-500 font-medium">
                        Showing{' '}
                        <span className="font-bold text-neutral-900 dark:text-neutral-100">
                            {attendees.length}
                        </span>{' '}
                        of{' '}
                        <span className="font-bold text-neutral-900 dark:text-neutral-100">
                            {summary.total}
                        </span>{' '}
                        matching records
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onOpenChange(false)}
                            className="h-8.5 px-3 text-xs"
                        >
                            Close
                        </Button>
                        <Button
                            size="sm"
                            onClick={handlePrint}
                            disabled={loading || attendees.length === 0 || isPrinting}
                            className="h-8.5 px-4 text-xs font-bold gap-1.5 shadow-xs"
                        >
                            <Printer className="size-4" />
                            <span>Print Registry ({attendees.length})</span>
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
