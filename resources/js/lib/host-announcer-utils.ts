import { getCategoryCustomField } from '@/lib/category-custom-fields';
import type { Attendee } from '@/types';

export type HostSortMode =
    | 'protocol'
    | 'time_asc'
    | 'time_desc'
    | 'name_asc'
    | 'name_desc'
    | 'location'
    | 'category_name';

export type HostStatusFilter = 'pending' | 'all' | 'called';
export type HostAttendanceFilter = 'all' | 'in_person' | 'represented';

export type HostAnnouncerSettings = {
    sortMode: HostSortMode;
    statusFilter: HostStatusFilter;
    attendanceFilter: HostAttendanceFilter;
    selectedCategoryId: number | 'all';
    soundEnabled: boolean;
    autoAdvanceDelay: number; // in milliseconds
    autoPopupNewRegistrations: boolean; // Auto popup when newly registered
    pollingInterval: number; // in milliseconds (default 5000)
};

export const DEFAULT_HOST_SETTINGS: HostAnnouncerSettings = {
    sortMode: 'protocol',
    statusFilter: 'pending',
    attendanceFilter: 'all',
    selectedCategoryId: 'all',
    soundEnabled: true,
    autoAdvanceDelay: 250,
    autoPopupNewRegistrations: true,
    pollingInterval: 5000,
};

const STORAGE_KEY = 'alayon_host_announcer_settings_v1';

export function loadHostAnnouncerSettings(): HostAnnouncerSettings {
    if (typeof window === 'undefined') {
        return DEFAULT_HOST_SETTINGS;
    }
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) return DEFAULT_HOST_SETTINGS;
        const parsed = JSON.parse(stored);
        return {
            ...DEFAULT_HOST_SETTINGS,
            ...parsed,
            autoPopupNewRegistrations: parsed.autoPopupNewRegistrations ?? true,
        };
    } catch {
        return DEFAULT_HOST_SETTINGS;
    }
}

export function saveHostAnnouncerSettings(
    settings: HostAnnouncerSettings,
): void {
    if (typeof window === 'undefined') return;
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
        window.dispatchEvent(
            new CustomEvent('alayon:host-settings-updated', {
                detail: settings,
            }),
        );
    } catch (e) {
        console.warn(
            'Failed to save host announcer settings to localStorage',
            e,
        );
    }
}

let sharedAudioContext: AudioContext | null = null;

export function getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
            .webkitAudioContext;
    if (!AudioCtx) return null;

    if (!sharedAudioContext || sharedAudioContext.state === 'closed') {
        try {
            sharedAudioContext = new AudioCtx();
        } catch {
            return null;
        }
    }
    return sharedAudioContext;
}

export function unlockAudioContext(): void {
    const ctx = getAudioContext();
    if (ctx && ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
    }
}

// Automatically listen for first user interactions to unlock web audio for the tab
if (typeof window !== 'undefined') {
    const unlockHandler = () => {
        unlockAudioContext();
    };
    ['click', 'touchstart', 'pointerdown', 'keydown'].forEach((eventName) => {
        window.addEventListener(eventName, unlockHandler, {
            capture: true,
            passive: true,
        });
    });
}

/**
 * Play a stage announcement chime using Web Audio API synthesis (zero external files required).
 */
export function playAnnouncementChime(): void {
    if (typeof window === 'undefined') return;
    try {
        const ctx = getAudioContext();
        if (!ctx) return;

        const playTone = () => {
            try {
                const now = ctx.currentTime;
                const osc1 = ctx.createOscillator();
                const osc2 = ctx.createOscillator();
                const gainNode = ctx.createGain();

                // Pleasant 2-tone melodic harmonic (D5 to A5, with D6 bell overtone)
                osc1.type = 'sine';
                osc1.frequency.setValueAtTime(587.33, now); // D5
                osc1.frequency.exponentialRampToValueAtTime(880, now + 0.12); // A5

                osc2.type = 'triangle';
                osc2.frequency.setValueAtTime(880, now);
                osc2.frequency.exponentialRampToValueAtTime(
                    1174.66,
                    now + 0.15,
                ); // D6

                gainNode.gain.setValueAtTime(0.25, now);
                gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

                osc1.connect(gainNode);
                osc2.connect(gainNode);
                gainNode.connect(ctx.destination);

                osc1.start(now);
                osc2.start(now);
                osc1.stop(now + 0.4);
                osc2.stop(now + 0.4);
            } catch {
                // Ignore tone synthesis failure
            }
        };

        if (ctx.state === 'suspended') {
            ctx.resume()
                .then(() => playTone())
                .catch(() => {});
        } else {
            playTone();
        }
    } catch {
        // Ignore audio playback failure gracefully
    }
}

/**
 * Play an alert chime when a new attendee registers (C6 to G6 melodic fanfare).
 */
export function playNewRegistrationChime(): void {
    if (typeof window === 'undefined') return;
    try {
        const ctx = getAudioContext();
        if (!ctx) return;

        const playTone = () => {
            try {
                const now = ctx.currentTime;
                const osc = ctx.createOscillator();
                const gainNode = ctx.createGain();

                // 3-note ascending chime: G5 -> C6 -> E6
                osc.type = 'sine';
                osc.frequency.setValueAtTime(783.99, now); // G5
                osc.frequency.setValueAtTime(1046.5, now + 0.1); // C6
                osc.frequency.setValueAtTime(1318.51, now + 0.2); // E6

                gainNode.gain.setValueAtTime(0.25, now);
                gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

                osc.connect(gainNode);
                gainNode.connect(ctx.destination);

                osc.start(now);
                osc.stop(now + 0.5);
            } catch {
                // Ignore tone synthesis failure
            }
        };

        if (ctx.state === 'suspended') {
            ctx.resume()
                .then(() => playTone())
                .catch(() => {});
        } else {
            playTone();
        }
    } catch {
        // Ignore audio failure gracefully
    }
}

/**
 * Get the jurisdiction text for an attendee based on category rules:
 * - Governors, PSWDO: only the province (e.g. "Agusan del Norte")
 * - Mayors, CSWDO, LGU Links, 4Ps Coordinators: municipality and province (e.g. "Carmen, Agusan del Norte")
 * - Remaining categories: custom field with value (e.g. "DILG" or "Agency: DILG")
 */
export function getAttendeeJurisdiction(
    attendee: Attendee | null | undefined,
    includeFieldLabel: boolean = false,
): string {
    if (!attendee) return '';

    const slug = (attendee.category?.slug || '').toLowerCase();
    const catName = (attendee.category?.name || '').toLowerCase();
    const catId = Number(attendee.category_id || attendee.category?.id || 0);

    const provinceName = (attendee.province?.prov_name || '').trim();
    const cityName = (attendee.city?.city_name || '').trim();
    const customVal = (
        attendee.agency_name ||
        attendee.office_agency ||
        ''
    ).trim();

    // 1. Governors, PSWDO: display ONLY the province
    const isGovOrPswdo =
        slug === 'governors' ||
        slug === 'pswdo' ||
        catId === 1 ||
        catId === 3 ||
        catName.includes('governor') ||
        catName === 'pswdo';

    if (isGovOrPswdo) {
        return provinceName;
    }

    // 2. Mayors, CSWDO, LGU Links, 4Ps Coordinators: display the province and municipality
    const isMayorOrLgu =
        slug === 'mayors' ||
        slug === 'cswdo' ||
        slug === 'lgu-links' ||
        slug === '4ps-coordinators' ||
        slug === '4ps' ||
        catId === 2 ||
        catId === 4 ||
        catId === 9 ||
        catId === 10 ||
        catName.includes('mayor') ||
        catName === 'cswdo' ||
        catName.includes('lgu link') ||
        catName.includes('4ps');

    if (isMayorOrLgu) {
        if (cityName && provinceName) {
            return `${cityName}, ${provinceName}`;
        }
        return cityName || provinceName || '';
    }

    // 3. Remaining categories: display the custom fields with value
    const customConfig = getCategoryCustomField(
        attendee.category || { id: catId, slug },
    );
    if (customVal) {
        if (includeFieldLabel && customConfig?.label) {
            return `${customConfig.label}: ${customVal}`;
        }
        return customVal;
    }

    // Fallback if custom field is empty
    if (cityName && provinceName) {
        return `${cityName}, ${provinceName}`;
    }
    return cityName || provinceName || '';
}

/**
 * Concatenate Official Position / Designation and add ' of ' jurisdiction.
 * Examples:
 * - "Provincial Governor of Agusan del Norte"
 * - "Municipal Mayor of Carmen, Agusan del Norte"
 * - "PSWDO of Agusan del Norte"
 * - "CSWDO of Bayugan City, Agusan del Sur"
 * - "LGU Link of Esperanza, Agusan del Sur"
 * - "4Ps Coordinator of Tubod, Surigao del Norte"
 * - "ITO-II of DILG"
 */
export function getAttendeePositionWithJurisdiction(
    attendee: Attendee | null | undefined,
): string {
    if (!attendee) return '';

    const slug = (attendee.category?.slug || '').toLowerCase();
    const catId = Number(attendee.category_id || attendee.category?.id || 0);

    let position = (attendee.position || attendee.designation || '').trim();
    if (!position) {
        if (slug === 'governors' || catId === 1) position = 'Governor';
        else if (slug === 'mayors' || catId === 2) position = 'Mayor';
        else if (slug === 'pswdo' || catId === 3) position = 'PSWDO';
        else if (slug === 'cswdo' || catId === 4) position = 'CSWDO';
        else if (slug === '4ps-coordinators' || slug === '4ps' || catId === 9)
            position = '4Ps Coordinator';
        else if (slug === 'lgu-links' || catId === 10) position = 'LGU Link';
        else if (slug === 'lbp-manager' || catId === 6)
            position = 'Branch Manager';
        else if (slug === 'ngas' || catId === 5) position = 'Official';
        else if (attendee.category?.name) position = attendee.category.name;
        else position = 'Official Guest';
    }

    const jurisdiction = getAttendeeJurisdiction(attendee, false);
    if (!jurisdiction) {
        return position;
    }

    // If position already includes "of [jurisdiction]", don't duplicate
    if (position.toLowerCase().includes(`of ${jurisdiction.toLowerCase()}`)) {
        return position;
    }

    return `${position} of ${jurisdiction}`;
}

/**
 * Check whether an attendee's category is allowed to pop up in the host call modal.
 * Default is true unless explicitly configured as allow_call === false in Protocol Priority Settings.
 */
export function isCategoryAllowedToCall(
    attendee: Attendee | null | undefined,
    categories?: { id: number; allow_call?: boolean }[],
): boolean {
    if (!attendee) return false;

    // Check authoritative categories list first if provided
    if (categories && categories.length > 0) {
        const matched = categories.find((c) => c.id === attendee.category_id);
        if (matched && typeof matched.allow_call === 'boolean') {
            return matched.allow_call;
        }
    }

    // Check attendee's nested category relation
    if (
        attendee.category &&
        typeof attendee.category.allow_call === 'boolean'
    ) {
        return attendee.category.allow_call;
    }

    // Default to true
    return true;
}

/**
 * Sort and filter attendees according to host settings.
 */
export function sortAndFilterAttendees(
    attendees: Attendee[],
    settings: HostAnnouncerSettings,
    searchQuery: string = '',
    categories?: { id: number; order?: number }[],
): Attendee[] {
    let result = [...attendees];

    // Category order lookup map from authoritative categories sequence
    const categoryOrderMap = new Map<number, number>();
    if (categories && categories.length > 0) {
        categories.forEach((cat) => {
            if (cat.id && typeof cat.order === 'number') {
                categoryOrderMap.set(cat.id, cat.order);
            }
        });
    }

    // Filter by search query
    if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        result = result.filter((a) => {
            const name = (a.fullname || a.name || '').toLowerCase();
            const pos = (a.position || a.designation || '').toLowerCase();
            const posWithJurisdiction =
                getAttendeePositionWithJurisdiction(a).toLowerCase();
            const agency = (a.agency_name || '').toLowerCase();
            const rep = (a.rep_fullname || '').toLowerCase();
            const prov = (a.province?.prov_name || '').toLowerCase();
            const city = (a.city?.city_name || '').toLowerCase();
            const brgy = (a.barangay?.brgy_name || '').toLowerCase();
            const cat = (a.category?.name || '').toLowerCase();
            return (
                name.includes(q) ||
                pos.includes(q) ||
                posWithJurisdiction.includes(q) ||
                agency.includes(q) ||
                rep.includes(q) ||
                prov.includes(q) ||
                city.includes(q) ||
                brgy.includes(q) ||
                cat.includes(q)
            );
        });
    }

    // Filter by Category
    if (settings.selectedCategoryId !== 'all') {
        const catId = Number(settings.selectedCategoryId);
        result = result.filter((a) => a.category_id === catId);
    }

    // Filter by Announcement Status
    if (settings.statusFilter === 'pending') {
        result = result.filter((a) => a.status === 'registered');
    } else if (settings.statusFilter === 'called') {
        result = result.filter((a) => a.status === 'called');
    }

    // Filter by Attendance Mode
    if (settings.attendanceFilter === 'in_person') {
        result = result.filter((a) => a.is_attending !== false);
    } else if (settings.attendanceFilter === 'represented') {
        result = result.filter((a) => a.is_attending === false);
    }

    // Sort based on sortMode
    result.sort((a, b) => {
        switch (settings.sortMode) {
            case 'protocol': {
                // Category protocol order (1 = highest priority, 999 = fallback)
                // Prefer authoritative order from categories sequence map, fallback to attendee's nested category, fallback to 999
                const orderA =
                    categoryOrderMap.get(a.category_id) ??
                    a.category?.order ??
                    999;
                const orderB =
                    categoryOrderMap.get(b.category_id) ??
                    b.category?.order ??
                    999;
                if (orderA !== orderB) {
                    return orderA - orderB;
                }
                // Within same protocol rank: arrival time (FIFO - earlier arrival first)
                const timeA = new Date(a.created_at || 0).getTime();
                const timeB = new Date(b.created_at || 0).getTime();
                if (timeA !== timeB) {
                    return timeA - timeB;
                }
                return a.id - b.id;
            }
            case 'time_asc': {
                // FIFO: First-in, first-out (earliest arrival first)
                const timeA = new Date(a.created_at || 0).getTime();
                const timeB = new Date(b.created_at || 0).getTime();
                if (timeA !== timeB) {
                    return timeA - timeB;
                }
                return a.id - b.id;
            }
            case 'time_desc': {
                // LIFO: Last-in, first-out (latest arrival first)
                const timeA = new Date(a.created_at || 0).getTime();
                const timeB = new Date(b.created_at || 0).getTime();
                if (timeA !== timeB) {
                    return timeB - timeA;
                }
                return b.id - a.id;
            }
            case 'name_asc': {
                const nameA = (a.fullname || a.name || '').trim();
                const nameB = (b.fullname || b.name || '').trim();
                const comp = nameA.localeCompare(nameB, undefined, {
                    sensitivity: 'base',
                });
                return comp !== 0 ? comp : a.id - b.id;
            }
            case 'name_desc': {
                const nameA = (a.fullname || a.name || '').trim();
                const nameB = (b.fullname || b.name || '').trim();
                const comp = nameB.localeCompare(nameA, undefined, {
                    sensitivity: 'base',
                });
                return comp !== 0 ? comp : b.id - a.id;
            }
            case 'location': {
                const provA = a.province?.prov_name || '';
                const provB = b.province?.prov_name || '';
                if (provA !== provB) return provA.localeCompare(provB);
                const cityA = a.city?.city_name || '';
                const cityB = b.city?.city_name || '';
                if (cityA !== cityB) return cityA.localeCompare(cityB);
                const brgyA = a.barangay?.brgy_name || '';
                const brgyB = b.barangay?.brgy_name || '';
                if (brgyA !== brgyB) return brgyA.localeCompare(brgyB);
                const nameA = (a.fullname || a.name || '').trim();
                const nameB = (b.fullname || b.name || '').trim();
                const nameComp = nameA.localeCompare(nameB);
                return nameComp !== 0 ? nameComp : a.id - b.id;
            }
            case 'category_name': {
                const catA = a.category?.name || '';
                const catB = b.category?.name || '';
                if (catA !== catB) return catA.localeCompare(catB);
                const nameA = (a.fullname || a.name || '').trim();
                const nameB = (b.fullname || b.name || '').trim();
                const nameComp = nameA.localeCompare(nameB);
                return nameComp !== 0 ? nameComp : a.id - b.id;
            }
            default:
                return a.id - b.id;
        }
    });

    return result;
}

export function getSortModeLabel(mode: HostSortMode | string): string {
    switch (mode) {
        case 'protocol':
            return 'Protocol Priority (VIP Hierarchy)';
        case 'time_asc':
            return 'Registration Time (FIFO)';
        case 'time_desc':
            return 'Registration Time (LIFO)';
        case 'name_asc':
            return 'Guest Name (A → Z)';
        case 'name_desc':
            return 'Guest Name (Z → A)';
        case 'location':
            return 'Jurisdiction (LGU)';
        case 'category_name':
            return 'Category Name (A → Z)';
        default:
            return 'Custom Sorting';
    }
}

export function getCategoryBadgeClass(slug?: string): string {
    switch (slug) {
        case 'governors':
            return 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30';
        case 'mayors':
            return 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30';
        case 'pswdo':
            return 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30';
        case 'cswdo':
            return 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30';
        case 'ngas':
            return 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-500/30';
        case 'media':
            return 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30';
        default:
            return 'bg-neutral-500/15 text-neutral-700 dark:text-neutral-300 border-neutral-500/30';
    }
}
