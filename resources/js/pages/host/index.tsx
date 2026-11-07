import { Head, router } from '@inertiajs/react';
import {
    Activity,
    Check,
    CheckCircle2,
    Clock,
    Filter,
    Layers,
    MapPin,
    Megaphone,
    Play,
    Radio,
    RotateCcw,
    Search,
    UserCheck,
    Users,
    X,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { HostAnnouncementModal } from '@/components/host/host-announcement-modal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { getCategoryCustomField } from '@/lib/category-custom-fields';
import {
    DEFAULT_HOST_SETTINGS,
    getAttendeeJurisdiction,
    getAttendeePositionWithJurisdiction,
    getCategoryBadgeClass,
    getSortModeLabel,
    type HostAnnouncerSettings,
    isCategoryAllowedToCall,
    loadHostAnnouncerSettings,
    playNewRegistrationChime,
    saveHostAnnouncerSettings,
    sortAndFilterAttendees,
} from '@/lib/host-announcer-utils';
import type { Attendee, EventItem, GuestCategory } from '@/types';

type CategoryStat = {
    id: number;
    name: string;
    slug: string;
    scope: string;
    total: number;
    announced: number;
    pending: number;
};

type Props = {
    event: EventItem;
    events: { id: number; title: string; event_date: string }[];
    categories: GuestCategory[];
    categoryStats: CategoryStat[];
    attendees: Attendee[];
    latestAnnounced?: Attendee | null;
    stats: {
        total: number;
        announced: number;
        pending: number;
    };
    filters: {
        category_id?: string | number | null;
        status?: string;
        search?: string;
    };
};

export default function HostAnnouncement({
    event,
    events,
    categories: initialCategories,
    attendees: initialAttendees,
    latestAnnounced,
    stats: initialStats,
}: Props) {
    // Categories sequence state linked to Protocol Priority settings
    const [categories, setCategories] = useState<GuestCategory[]>(initialCategories);
    const categoriesRef = useRef<GuestCategory[]>(categories);
    categoriesRef.current = categories;

    useEffect(() => {
        setCategories(initialCategories);
        categoriesRef.current = initialCategories;
    }, [initialCategories]);

    // Announcer settings (strictly Protocol Priority sequence and Pending stage queue)
    const [settings, setSettings] = useState<HostAnnouncerSettings>(() => {
        const loaded = loadHostAnnouncerSettings();
        return {
            ...loaded,
            sortMode: 'protocol',
            statusFilter: 'pending',
        };
    });

    // Synchronize settings live if updated from Settings sidebar tab
    useEffect(() => {
        const handleSync = () => {
            const loaded = loadHostAnnouncerSettings();
            setSettings((prev) => ({
                ...prev,
                ...loaded,
                sortMode: 'protocol',
                statusFilter: 'pending',
            }));
        };
        window.addEventListener('storage', handleSync);
        window.addEventListener('alayon:host-settings-updated', handleSync);
        return () => {
            window.removeEventListener('storage', handleSync);
            window.removeEventListener('alayon:host-settings-updated', handleSync);
        };
    }, []);

    // Search query
    const [searchQuery, setSearchQuery] = useState('');

    // Local copy of attendees for instant optimistic updates
    const [attendees, setAttendees] = useState<Attendee[]>(initialAttendees);

    // Modal state for 1-by-1 announcement popup
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalGuest, setModalGuest] = useState<Attendee | null>(null);
    const [currentGuestId, setCurrentGuestId] = useState<number | null>(null);

    // Active refs to avoid stale closures in the 5-second polling interval
    const settingsRef = useRef<HostAnnouncerSettings>(settings);
    settingsRef.current = settings;

    const isModalOpenRef = useRef<boolean>(isModalOpen);
    isModalOpenRef.current = isModalOpen;

    const attendeesRef = useRef<Attendee[]>(attendees);
    attendeesRef.current = attendees;

    const searchQueryRef = useRef<string>(searchQuery);
    searchQueryRef.current = searchQuery;

    // Track attendee IDs that have already been seen by this client
    const seenAttendeeIdsRef = useRef<Set<number>>(new Set(initialAttendees.map((a) => a.id)));
    const [dismissedGuestId, setDismissedGuestId] = useState<number | null>(null);
    const isAdvancingRef = useRef<boolean>(false);

    // Live Auto-Polling (every 5 seconds) and Auto Pop-up states
    const [lastKnownId, setLastKnownId] = useState<number>(() => {
        return initialAttendees.reduce((max, a) => Math.max(max, a.id), 0);
    });
    const lastKnownIdRef = useRef<number>(lastKnownId);
    lastKnownIdRef.current = lastKnownId;

    const [isLiveRegistration, setIsLiveRegistration] = useState(false);
    const [isPollingActive, setIsPollingActive] = useState(true);
    const [newRegistrationAlert, setNewRegistrationAlert] = useState<Attendee | null>(null);

    // Centralized settings updater: updates React state, live ref, and saves to localStorage
    const handleUpdateSettings = (newSettings: HostAnnouncerSettings) => {
        setSettings(newSettings);
        settingsRef.current = newSettings;
        saveHostAnnouncerSettings(newSettings);
    };

    // Unified helper to open the popup modal for any guest
    const openModalForGuest = (guest: Attendee, isLiveArrival: boolean = false) => {
        setDismissedGuestId(null);
        setModalGuest(guest);
        setCurrentGuestId(guest.id);
        setIsLiveRegistration(isLiveArrival);
        setIsModalOpen(true);
        isModalOpenRef.current = true;
    };

    // Keep attendees in sync when props change from server
    useEffect(() => {
        setAttendees(initialAttendees);
        attendeesRef.current = initialAttendees;
        initialAttendees.forEach((a) => seenAttendeeIdsRef.current.add(a.id));
        const maxId = initialAttendees.reduce((max, a) => Math.max(max, a.id), 0);
        if (maxId > lastKnownIdRef.current) {
            setLastKnownId(maxId);
            lastKnownIdRef.current = maxId;
        }
    }, [initialAttendees]);

    // Live Query / Polling Effect: queries backend every 5 seconds for newly registered guests
    useEffect(() => {
        let isMounted = true;

        const pollNewRegistrations = async () => {
            if (!isPollingActive) return;

            try {
                const currentSinceId = lastKnownIdRef.current;
                // Add cache-busting timestamp parameter to ensure browser never caches polling responses
                const url = `/api/events/${event.id}/host-poll?since_id=${currentSinceId}&_t=${Date.now()}`;
                const res = await fetch(url, {
                    cache: 'no-store',
                    headers: {
                        Accept: 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                        'Cache-Control': 'no-cache, no-store',
                    },
                });

                if (!res.ok) return;
                const data = await res.json();
                if (!isMounted) return;

                const incomingAttendees: Attendee[] = Array.isArray(data.attendees) ? data.attendees : [];

                // Detect newly arrived guests: any incoming guest with status !== 'called' whose ID was NOT seen yet
                const brandNewAttendees: Attendee[] = incomingAttendees.filter(
                    (a: Attendee) => a.status !== 'called' && !seenAttendeeIdsRef.current.has(a.id)
                );

                // Also check data.new_attendees from server
                const serverNewAttendees: Attendee[] = Array.isArray(data.new_attendees)
                    ? data.new_attendees.filter((a: Attendee) => a.status !== 'called')
                    : [];

                // Combine and deduplicate
                const allNewRegistrationsMap = new Map<number, Attendee>();
                brandNewAttendees.forEach((a: Attendee) => allNewRegistrationsMap.set(a.id, a));
                serverNewAttendees.forEach((a: Attendee) => allNewRegistrationsMap.set(a.id, a));
                const allNewRegistrations: Attendee[] = Array.from(allNewRegistrationsMap.values());

                // Sync all attendees to reflect live counts & table updates
                if (incomingAttendees.length > 0) {
                    setAttendees(incomingAttendees);
                    attendeesRef.current = incomingAttendees;

                    // Add all to seen set
                    incomingAttendees.forEach((a: Attendee) => seenAttendeeIdsRef.current.add(a.id));

                    const highestId = incomingAttendees.reduce(
                        (max: number, a: Attendee) => Math.max(max, a.id),
                        lastKnownIdRef.current
                    );
                    if (highestId > lastKnownIdRef.current) {
                        setLastKnownId(highestId);
                        lastKnownIdRef.current = highestId;
                    }
                }

                // Update categories sequence if returned by polling
                if (Array.isArray(data.categories) && data.categories.length > 0) {
                    setCategories(data.categories);
                    categoriesRef.current = data.categories;
                }

                const currentSettings = settingsRef.current;
                const currentSearch = searchQueryRef.current;
                const currentCats = categoriesRef.current;
                const fullList = incomingAttendees.length > 0 ? incomingAttendees : attendeesRef.current;

                // STRICTLY SORT ALL ATTENDEES ACCORDING TO CURRENT SORTING SELECTION & PROTOCOL CATEGORY SEQUENCE!
                const sortedQueue = sortAndFilterAttendees(fullList, currentSettings, currentSearch, currentCats);
                const uncalledSorted = sortedQueue.filter((a: Attendee) => a.status !== 'called');

                // If newly arrived guests detected: alert and chime ONLY if allowed to call in popup modal
                const allowedNewRegistrations = allNewRegistrations.filter((a: Attendee) =>
                    isCategoryAllowedToCall(a, currentCats)
                );

                if (allowedNewRegistrations.length > 0) {
                    const sortedNewRegistrations = sortAndFilterAttendees(allowedNewRegistrations, currentSettings, '', currentCats);
                    const topNewGuest = sortedNewRegistrations[0] || allowedNewRegistrations[0];
                    setNewRegistrationAlert(topNewGuest);

                    // Clear dismissal state so any newly arrived registration triggers popup immediately
                    setDismissedGuestId(null);

                    // Play chime if audio is enabled
                    if (currentSettings.soundEnabled) {
                        playNewRegistrationChime();
                    }
                }
            } catch {
                // Ignore transient network errors
            }
        };

        const intervalMs = settings.pollingInterval || 5000;
        const intervalId = setInterval(pollNewRegistrations, intervalMs);

        return () => {
            isMounted = false;
            clearInterval(intervalId);
        };
    }, [event.id, isPollingActive, settings.pollingInterval]);

    // Filter and sort the attendees queue based on current settings and protocol category sequence.
    // Strictly displays only guests from categories allowed to call in the Announcement Queue Sequence.
    const queue = useMemo(() => {
        const sorted = sortAndFilterAttendees(attendees, settings, searchQuery, categories);
        return sorted.filter((a) => isCategoryAllowedToCall(a, categories));
    }, [attendees, settings, searchQuery, categories]);

    // Unannounced (pending) attendees in the queue
    const pendingInQueue = useMemo(() => {
        return queue.filter((a) => a.status !== 'called');
    }, [queue]);

    // Current guest being displayed in the modal (fallback to lookup if modalGuest is not directly set)
    const currentGuest = useMemo(() => {
        if (modalGuest) return modalGuest;
        if (!currentGuestId) return null;
        return queue.find((a) => a.id === currentGuestId) || attendees.find((a) => a.id === currentGuestId) || null;
    }, [modalGuest, currentGuestId, queue, attendees]);

    const currentGuestModalIndex = useMemo(() => {
        if (!currentGuest) return -1;
        const idx = queue.findIndex((a) => a.id === currentGuest.id);
        return idx;
    }, [queue, currentGuest]);

    // Next guest in queue ready to be called via popup modal
    const nextUpGuest = useMemo(() => {
        return queue.find((a) => a.status !== 'called') || queue[0] || null;
    }, [queue]);

    // Automatic Pop-Up:
    // Whenever there is an entry in the Announcement Queue Sequence list that is allowed to call, automatically popup the modal so that it will be called by the host.
    useEffect(() => {
        if (isModalOpen || isAdvancingRef.current) return;
        if (!settings.autoPopupNewRegistrations) return;

        const nextPending = queue.find((a) => a.status !== 'called');
        if (nextPending && nextPending.id !== dismissedGuestId) {
            openModalForGuest(nextPending, false);
        }
    }, [queue, isModalOpen, settings.autoPopupNewRegistrations, dismissedGuestId]);

    // Live pending count of guests allowed to call
    const pendingCount = attendees.filter((a) => a.status !== 'called' && isCategoryAllowedToCall(a, categories)).length;

    // All called guests sorted by announcement recency
    const allCalledGuests = useMemo(() => {
        return attendees
            .filter((a) => a.status === 'called')
            .sort((a, b) => new Date(b.updated_at || b.created_at || 0).getTime() - new Date(a.updated_at || a.created_at || 0).getTime());
    }, [attendees]);

    // Search filter by name for called guests
    const [calledSearchQuery, setCalledSearchQuery] = useState('');

    const filteredCalledGuests = useMemo(() => {
        if (!calledSearchQuery.trim()) {
            return allCalledGuests;
        }
        const q = calledSearchQuery.trim().toLowerCase();
        return allCalledGuests.filter((guest) => {
            const fullName = (guest.fullname || guest.name || '').toLowerCase();
            const prefix = (guest.prefix_name || '').toLowerCase();
            const repName = (guest.rep_fullname || guest.rep_name || '').toLowerCase();
            const repPrefix = (guest.rep_prefix_name || '').toLowerCase();
            const position = (guest.position || guest.designation || '').toLowerCase();
            const posWithJurisdiction = getAttendeePositionWithJurisdiction(guest).toLowerCase();
            const jurisdiction = getAttendeeJurisdiction(guest, true).toLowerCase();

            return (
                fullName.includes(q) ||
                prefix.includes(q) ||
                repName.includes(q) ||
                repPrefix.includes(q) ||
                position.includes(q) ||
                posWithJurisdiction.includes(q) ||
                jurisdiction.includes(q)
            );
        });
    }, [allCalledGuests, calledSearchQuery]);

    // Pagination for queue list to call (card UI)
    const [queuePage, setQueuePage] = useState(1);
    const queuePerPage = 16;
    const totalQueuePages = Math.max(1, Math.ceil(queue.length / queuePerPage));
    const validQueuePage = Math.min(queuePage, totalQueuePages);

    const paginatedQueue = useMemo(() => {
        const start = (validQueuePage - 1) * queuePerPage;
        return queue.slice(start, start + queuePerPage);
    }, [queue, validQueuePage, queuePerPage]);

    useEffect(() => {
        setQueuePage(1);
    }, [searchQuery, settings.selectedCategoryId, settings.statusFilter, settings.attendanceFilter]);

    const [calledPage, setCalledPage] = useState(1);
    const calledPerPage = 8;
    const totalCalledPages = Math.max(1, Math.ceil(filteredCalledGuests.length / calledPerPage));
    const validCalledPage = Math.min(calledPage, totalCalledPages);

    const paginatedCalledGuests = useMemo(() => {
        const start = (validCalledPage - 1) * calledPerPage;
        return filteredCalledGuests.slice(start, start + calledPerPage);
    }, [filteredCalledGuests, validCalledPage, calledPerPage]);

    // Start / Open Announcer Modal from the next up guest in call queue
    const handleStartAnnouncing = () => {
        const target = nextUpGuest || queue[0];
        if (target) {
            openModalForGuest(target, false);
        } else {
            toast.info('No guests from categories allowed to call in popup modal.');
        }
    };

    // Open Announcer Modal for a specific guest
    const handleOpenForGuest = (guest: Attendee) => {
        if (!isCategoryAllowedToCall(guest, categories)) {
            toast.warning(
                `Category "${guest.category?.name || 'Guest'}" is not allowed to call in popup modal (configured in Protocol Priority Settings).`
            );
            return;
        }
        openModalForGuest(guest, false);
    };

    // Double-tap announce handler:
    // "when the announcer double tap the popup modal, the modal will close and tagged as called then another popup will display according to the sorting settings."
    const handleAnnounceAndNext = (guest: Attendee) => {
        isAdvancingRef.current = true;

        // 1. Determine the next candidate in sequence among allowed-to-call categories BEFORE mutating state
        const currentUncalled = sortAndFilterAttendees(
            attendees.filter((a) => a.status !== 'called' && isCategoryAllowedToCall(a, categories)),
            settings,
            searchQuery,
            categories
        );
        const currentIndex = currentUncalled.findIndex((a) => a.id === guest.id);

        let nextGuest: Attendee | null = null;
        if (currentIndex >= 0 && currentIndex < currentUncalled.length - 1) {
            // Next guest in the Protocol Priority sequence
            nextGuest = currentUncalled[currentIndex + 1];
        } else if (currentUncalled.length > 1) {
            // Wrap around to the first remaining uncalled guest (excluding the one just called)
            const remaining = currentUncalled.filter((a) => a.id !== guest.id);
            if (remaining.length > 0) {
                nextGuest = remaining[0];
            }
        }

        // 2. Optimistic update
        const updatedAttendees = attendees.map((a) =>
            a.id === guest.id ? { ...a, status: 'called' as const, is_announced: true } : a
        );
        setAttendees(updatedAttendees);
        attendeesRef.current = updatedAttendees;

        // 3. Trigger server announce in background
        router.post(
            `/attendees/${guest.id}/announce`,
            {},
            {
                preserveScroll: true,
                preserveState: true,
            }
        );

        // 4. Close the modal with animation as requested
        setIsModalOpen(false);
        isModalOpenRef.current = false;
        setModalGuest(null);

        // 5. After the configured delay, display the next popup modal according to Protocol Priority settings
        if (nextGuest) {
            const candidate = nextGuest;
            setTimeout(() => {
                openModalForGuest(candidate, false);
                isAdvancingRef.current = false;
            }, settings.autoAdvanceDelay);
        } else {
            isAdvancingRef.current = false;
        }
    };

    // Revert announcement (undo)
    const handleUnannounce = (guest: Attendee) => {
        const revertedAttendees = attendees.map((a) =>
            a.id === guest.id ? { ...a, status: 'registered' as const, is_announced: false } : a
        );
        setAttendees(revertedAttendees);
        attendeesRef.current = revertedAttendees;

        router.post(
            `/attendees/${guest.id}/unannounce`,
            {},
            {
                preserveScroll: true,
                preserveState: true,
            }
        );
    };

    return (
        <>
            <Head title={`Host Console - ${event.title}`} />

            <div className="flex flex-col gap-6 p-4 md:p-8 max-w-7xl mx-auto w-full">
                {/* Quick Toolbar: Pending Queue Stats, Live Polling & Search */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                        {/* Live 5-Second Polling Status Badge */}
                        <button
                            type="button"
                            onClick={() => setIsPollingActive(!isPollingActive)}
                            className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-all ${
                                isPollingActive
                                    ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                                    : 'bg-neutral-200 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400'
                            }`}
                            title="Click to pause or resume 5-second live polling"
                        >
                            <span
                                className={`size-2 rounded-full ${
                                    isPollingActive ? 'bg-emerald-500 animate-pulse' : 'bg-neutral-400'
                                }`}
                            />
                            <span>{isPollingActive ? 'Live Polling: 5s' : 'Polling Paused'}</span>
                        </button>

                        <div className="inline-flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-3.5 py-2 text-xs font-bold text-primary dark:bg-primary/10">
                            <Users className="size-3.5" />
                            <span>Pending Stage Queue ({pendingCount})</span>
                        </div>

                        {settings.selectedCategoryId !== 'all' && (
                            <Badge variant="outline" className="text-xs font-semibold">
                                Category: {categories.find((c) => c.id === Number(settings.selectedCategoryId))?.name || 'Selected'}
                            </Badge>
                        )}
                    </div>

                    {/* Search Box */}
                    <div className="relative w-full sm:w-72">
                        <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-neutral-400" />
                        <Input
                            type="search"
                            placeholder="Search pending guest, title, LGU..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 text-xs rounded-xl"
                        />
                    </div>
                </div>

                {/* Live Registration Arrival Alert Banner */}
                {newRegistrationAlert && (
                    <div className="flex items-center justify-between gap-3 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-3.5 text-xs text-amber-950 dark:text-amber-100 shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="flex items-center gap-2.5 min-w-0">
                            <span className="flex size-2.5 rounded-full bg-amber-500 animate-ping shrink-0" />
                            <div className="flex flex-wrap items-baseline gap-1.5 min-w-0">
                                <span className="font-black uppercase tracking-wider text-amber-700 dark:text-amber-400">
                                    ⚡ Newly Registered Guest:
                                </span>
                                <span className="font-extrabold truncate">
                                    {newRegistrationAlert.prefix_name ? `${newRegistrationAlert.prefix_name} ` : ''}
                                    {newRegistrationAlert.fullname || newRegistrationAlert.name}
                                </span>
                                <span className="text-muted-foreground truncate">
                                    ({getAttendeePositionWithJurisdiction(newRegistrationAlert)})
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                    openModalForGuest(newRegistrationAlert, true);
                                }}
                                className="h-8 rounded-xl border-amber-500/40 bg-amber-500/20 text-xs font-bold text-amber-950 hover:bg-amber-500/30 dark:text-amber-100"
                            >
                                <Play className="size-3 fill-current mr-1" />
                                <span>Announce Now</span>
                            </Button>
                            <button
                                type="button"
                                onClick={() => setNewRegistrationAlert(null)}
                                className="size-7 flex items-center justify-center rounded-lg text-amber-600 hover:bg-amber-500/20 hover:text-amber-950 dark:text-amber-400"
                                title="Dismiss banner"
                            >
                                ✕
                            </button>
                        </div>
                    </div>
                )}

                {/* Queue Timeline & Table */}
                <Card className="rounded-3xl shadow-sm border border-neutral-200 dark:border-neutral-800">
                    <CardHeader className="pb-3 border-b border-neutral-100 dark:border-neutral-800">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                            <div>
                                <CardTitle className="text-lg font-bold flex flex-wrap items-center gap-2">
                                    <span>Announcement Queue Sequence</span>
                                    <Badge variant="outline" className="text-xs font-mono">
                                        {queue.length} Guests to Call
                                    </Badge>
                                </CardTitle>
                                <CardDescription className="text-xs">
                                    Guests are strictly ordered according to Category Protocol Priority sequence. Only categories allowed to call are included in this queue.
                                </CardDescription>
                            </div>

                            <Button
                                size="sm"
                                variant="outline"
                                onClick={handleStartAnnouncing}
                                disabled={queue.length === 0}
                                className="rounded-xl gap-1.5 text-xs font-bold border-primary/40 text-primary hover:bg-primary/5 disabled:opacity-50"
                            >
                                <Play className="size-3.5 fill-current" />
                                <span>Launch Pop-up Queue</span>
                            </Button>
                        </div>
                    </CardHeader>

                    <CardContent className="p-4">
                        {queue.length === 0 ? (
                            <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
                                <Users className="size-12 opacity-30" />
                                <h3 className="mt-3 text-base font-bold text-neutral-800 dark:text-neutral-200">
                                    No pending guests in this queue view
                                </h3>
                                <p className="text-xs mt-1 max-w-sm">
                                    {searchQuery
                                        ? `No pending guests match "${searchQuery}". Clear the search query to see the full queue.`
                                        : 'All registered guests have been called! You can view and manage called guests in the section below.'}
                                </p>
                            </div>
                        ) : (
                            <>
                                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
                                    {paginatedQueue.map((guest, pageIdx) => {
                                        const globalIdx = (validQueuePage - 1) * queuePerPage + pageIdx;
                                        const isAnnounced = guest.status === 'called';
                                        const isNextUp = globalIdx === 0 && !isAnnounced;

                                        return (
                                            <div
                                                key={guest.id}
                                                onClick={() => handleOpenForGuest(guest)}
                                                className={`flex items-center justify-between gap-2.5 rounded-2xl border p-3 transition-all cursor-pointer ${
                                                    isNextUp
                                                        ? 'border-primary/50 bg-primary/5 shadow-xs ring-2 ring-primary/20 dark:bg-primary/10'
                                                        : isAnnounced
                                                        ? 'border-emerald-500/30 bg-emerald-500/5 opacity-80'
                                                        : 'border-neutral-200 bg-neutral-50/60 dark:border-neutral-800 dark:bg-neutral-900/50 hover:bg-neutral-100/60 dark:hover:bg-neutral-800/60'
                                                }`}
                                            >
                                                <div className="flex items-center gap-2.5 min-w-0">
                                                    {/* Queue Order Number Badge */}
                                                    <span
                                                        className={`inline-flex size-7 shrink-0 items-center justify-center rounded-xl text-xs font-mono font-black ${
                                                            isNextUp
                                                                ? 'bg-primary text-primary-foreground shadow-xs animate-pulse'
                                                                : isAnnounced
                                                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                                                : 'bg-neutral-200/80 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300'
                                                        }`}
                                                        title={`Queue Order #${globalIdx + 1}`}
                                                    >
                                                        #{globalIdx + 1}
                                                    </span>

                                                    {/* Guest Name & Category Info */}
                                                    <div className="flex flex-col min-w-0">
                                                        <span className="font-bold text-xs truncate text-neutral-900 dark:text-white">
                                                            {guest.prefix_name ? `${guest.prefix_name} ` : ''}
                                                            {guest.fullname || guest.name}
                                                        </span>

                                                        <div className="mt-0.5 flex items-center gap-1.5 text-[11px] truncate text-muted-foreground">
                                                            <Badge
                                                                variant="outline"
                                                                className={`text-[9px] px-1.5 py-0 font-bold shrink-0 ${getCategoryBadgeClass(guest.category?.slug)}`}
                                                            >
                                                                {guest.category?.name || 'Guest'}
                                                            </Badge>
                                                            <span className="truncate">{getAttendeePositionWithJurisdiction(guest)}</span>
                                                        </div>

                                                        {!guest.is_attending && guest.rep_fullname && (
                                                            <span className="mt-0.5 text-[10px] text-amber-700 dark:text-amber-400 font-medium truncate">
                                                                Rep: {guest.rep_prefix_name ? `${guest.rep_prefix_name} ` : ''}{guest.rep_fullname}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Right Action Button */}
                                                <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
                                                    {isAnnounced ? (
                                                        <div className="flex items-center gap-1">
                                                            <span className="inline-flex items-center gap-0.5 rounded-full border border-emerald-500/30 bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                                                                <Check className="size-3 stroke-[2.5]" />
                                                                <span>Called</span>
                                                            </span>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                title="Undo Announcement (Revert to Pending)"
                                                                onClick={() => handleUnannounce(guest)}
                                                                className="size-7 text-neutral-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30"
                                                            >
                                                                <RotateCcw className="size-3.5" />
                                                            </Button>
                                                        </div>
                                                    ) : (
                                                        <Button
                                                            size="sm"
                                                            onClick={() => handleOpenForGuest(guest)}
                                                            className="h-7 px-2.5 rounded-xl gap-1 bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 shadow-xs"
                                                            title="Call Guest in Popup Modal"
                                                        >
                                                            <Megaphone className="size-3" />
                                                            <span>Call</span>
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Pagination Controls */}
                                {totalQueuePages > 1 && (
                                    <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-neutral-100 dark:border-neutral-800 text-xs">
                                        <span className="text-muted-foreground text-[11px]">
                                            Showing {(validQueuePage - 1) * queuePerPage + 1} to {Math.min(validQueuePage * queuePerPage, queue.length)} of {queue.length} guests in queue
                                            {searchQuery.trim() && ` (filtered from ${attendees.length} total)`}
                                        </span>

                                        <div className="flex items-center gap-1.5">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                disabled={validQueuePage <= 1}
                                                onClick={() => setQueuePage((p) => Math.max(1, p - 1))}
                                                className="h-7 px-2.5 text-xs font-semibold rounded-lg"
                                            >
                                                Previous
                                            </Button>

                                            <div className="flex items-center gap-1 px-1.5 text-xs font-bold text-neutral-700 dark:text-neutral-300">
                                                <span>Page {validQueuePage} of {totalQueuePages}</span>
                                            </div>

                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                disabled={validQueuePage >= totalQueuePages}
                                                onClick={() => setQueuePage((p) => Math.min(totalQueuePages, p + 1))}
                                                className="h-7 px-2.5 text-xs font-semibold rounded-lg"
                                            >
                                                Next
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </CardContent>
                </Card>

                {/* Recently Called Guests Panel (All Called Guests with Pagination and Search) */}
                <Card className="rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-xs">
                    <CardHeader className="pb-3 border-b border-neutral-100 dark:border-neutral-800">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                            <div>
                                <CardTitle className="text-base font-bold flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                                    <CheckCircle2 className="size-4" />
                                    <span>Recently Called Guests</span>
                                </CardTitle>
                                <CardDescription className="text-xs">
                                    All guests announced on the big screen. Click the undo button if a guest was called prematurely.
                                </CardDescription>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                                {/* Search Filter by Name */}
                                <div className="relative w-full sm:w-64">
                                    <Search className="absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-neutral-400" />
                                    <Input
                                        type="search"
                                        placeholder="Search called guest by name..."
                                        value={calledSearchQuery}
                                        onChange={(e) => {
                                            setCalledSearchQuery(e.target.value);
                                            setCalledPage(1);
                                        }}
                                        className="pl-8.5 pr-8 h-8 text-xs rounded-xl"
                                    />
                                    {calledSearchQuery && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setCalledSearchQuery('');
                                                setCalledPage(1);
                                            }}
                                            className="absolute top-1/2 right-2.5 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
                                            title="Clear search"
                                        >
                                            <X className="size-3.5" />
                                        </button>
                                    )}
                                </div>

                                <Badge variant="outline" className="text-xs font-mono shrink-0 border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                                    {calledSearchQuery.trim()
                                        ? `${filteredCalledGuests.length} of ${allCalledGuests.length} Found`
                                        : `${allCalledGuests.length} Total Called`}
                                </Badge>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-4">
                        {allCalledGuests.length === 0 ? (
                            <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
                                <UserCheck className="size-10 opacity-30" />
                                <p className="mt-2 text-xs font-medium">
                                    No guests have been called yet. As guests are announced, they will appear here.
                                </p>
                            </div>
                        ) : filteredCalledGuests.length === 0 ? (
                            <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
                                <Search className="size-8 opacity-30 text-neutral-400" />
                                <p className="mt-2 text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                                    No called guests match "{calledSearchQuery}"
                                </p>
                                <p className="mt-0.5 text-[11px] text-muted-foreground">
                                    Check your spelling or search by another name.
                                </p>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        setCalledSearchQuery('');
                                        setCalledPage(1);
                                    }}
                                    className="mt-3 h-7 rounded-lg text-xs font-semibold gap-1.5"
                                >
                                    <X className="size-3" />
                                    <span>Clear Search Filter</span>
                                </Button>
                            </div>
                        ) : (
                            <>
                                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
                                    {paginatedCalledGuests.map((guest) => (
                                        <div
                                            key={guest.id}
                                            className="flex items-center justify-between gap-2 rounded-2xl border border-neutral-200 bg-neutral-50/60 p-3 dark:border-neutral-800 dark:bg-neutral-900/50 hover:bg-neutral-100/60 dark:hover:bg-neutral-800/60 transition-colors"
                                        >
                                            <div className="flex flex-col min-w-0">
                                                <span className="font-bold text-xs truncate text-neutral-900 dark:text-white">
                                                    {guest.prefix_name ? `${guest.prefix_name} ` : ''}
                                                    {guest.fullname || guest.name}
                                                </span>
                                                <div className="mt-0.5 flex items-center gap-1.5 text-[11px] truncate text-muted-foreground">
                                                    <Badge
                                                        variant="outline"
                                                        className={`text-[9px] px-1.5 py-0 font-bold ${getCategoryBadgeClass(guest.category?.slug)}`}
                                                    >
                                                        {guest.category?.name || 'Guest'}
                                                    </Badge>
                                                    <span className="truncate">{getAttendeePositionWithJurisdiction(guest)}</span>
                                                </div>
                                            </div>

                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                title="Undo Announcement (Revert to Pending)"
                                                onClick={() => handleUnannounce(guest)}
                                                className="size-7 shrink-0 text-neutral-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30"
                                            >
                                                <RotateCcw className="size-3.5" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>

                                {/* Pagination Controls */}
                                {totalCalledPages > 1 && (
                                    <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-neutral-100 dark:border-neutral-800 text-xs">
                                        <span className="text-muted-foreground text-[11px]">
                                            Showing {(validCalledPage - 1) * calledPerPage + 1} to {Math.min(validCalledPage * calledPerPage, filteredCalledGuests.length)} of {filteredCalledGuests.length} called guests
                                            {calledSearchQuery.trim() && ` (filtered from ${allCalledGuests.length} total)`}
                                        </span>

                                        <div className="flex items-center gap-1.5">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                disabled={validCalledPage <= 1}
                                                onClick={() => setCalledPage((p) => Math.max(1, p - 1))}
                                                className="h-7 px-2.5 text-xs font-semibold rounded-lg"
                                            >
                                                Previous
                                            </Button>

                                            <div className="flex items-center gap-1 px-1.5 text-xs font-bold text-neutral-700 dark:text-neutral-300">
                                                <span>Page {validCalledPage} of {totalCalledPages}</span>
                                            </div>

                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                disabled={validCalledPage >= totalCalledPages}
                                                onClick={() => setCalledPage((p) => Math.min(totalCalledPages, p + 1))}
                                                className="h-7 px-2.5 text-xs font-semibold rounded-lg"
                                            >
                                                Next
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* 1-by-1 Announcement Popup Modal (strictly displays guests from categories allowed to call) */}
            <HostAnnouncementModal
                open={isModalOpen}
                onClose={() => {
                    if (currentGuest) {
                        setDismissedGuestId(currentGuest.id);
                    }
                    setIsModalOpen(false);
                    setIsLiveRegistration(false);
                    setModalGuest(null);
                }}
                attendee={currentGuest}
                queueIndex={currentGuestModalIndex >= 0 ? currentGuestModalIndex : 0}
                queueTotal={Math.max(queue.length, 1)}
                onAnnounceAndNext={handleAnnounceAndNext}
                settings={settings}
                categories={categories}
                isLiveNewRegistration={isLiveRegistration}
            />
        </>
    );
}

HostAnnouncement.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Host Announcement Console', href: '/host' },
    ],
};
