import {
    ArrowDownAZ,
    ArrowUpZA,
    Clock,
    Crown,
    Layers,
    MapPin,
    RotateCcw,
    SlidersHorizontal,
    Sparkles,
    Volume2,
    VolumeX,
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
    DEFAULT_HOST_SETTINGS,
    type HostAnnouncerSettings,
    type HostSortMode,
    saveHostAnnouncerSettings,
} from '@/lib/host-announcer-utils';
import type { GuestCategory } from '@/types';

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    settings: HostAnnouncerSettings;
    categories: GuestCategory[];
    onSettingsChange: (newSettings: HostAnnouncerSettings) => void;
};

const SORT_OPTIONS: {
    mode: HostSortMode;
    label: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
}[] = [
    {
        mode: 'protocol',
        label: 'Protocol Priority Order',
        description:
            'VIP category hierarchy (Governors, Mayors, NGAs, etc.), then arrival time',
        icon: Crown,
    },
    {
        mode: 'time_asc',
        label: 'Registration Time (FIFO)',
        description: 'First to register/check-in is announced first',
        icon: Clock,
    },
    {
        mode: 'time_desc',
        label: 'Registration Time (LIFO)',
        description: 'Most recent arrivals/check-ins are announced first',
        icon: Clock,
    },
    {
        mode: 'name_asc',
        label: 'Full Name (A → Z)',
        description: 'Alphabetical order by attendee full name',
        icon: ArrowDownAZ,
    },
    {
        mode: 'name_desc',
        label: 'Full Name (Z → A)',
        description: 'Reverse alphabetical order by attendee full name',
        icon: ArrowUpZA,
    },
    {
        mode: 'location',
        label: 'Jurisdiction / LGU',
        description: 'Grouped by Province, then City/Municipality and Barangay',
        icon: MapPin,
    },
    {
        mode: 'category_name',
        label: 'Category Name (A → Z)',
        description: 'Alphabetical order by category designation name',
        icon: Layers,
    },
];

export function HostSortingSettingsDialog({
    open,
    onOpenChange,
    settings,
    categories,
    onSettingsChange,
}: Props) {
    const [draft, setDraft] = useState<HostAnnouncerSettings>(settings);

    // Sync draft whenever dialog opens
    const handleOpenChange = (isOpen: boolean) => {
        if (isOpen) {
            setDraft(settings);
        }
        onOpenChange(isOpen);
    };

    const handleApply = () => {
        saveHostAnnouncerSettings(draft);
        onSettingsChange(draft);
        onOpenChange(false);
    };

    const handleReset = () => {
        setDraft(DEFAULT_HOST_SETTINGS);
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto p-6">
                <DialogHeader className="border-b border-neutral-100 pb-3 dark:border-neutral-800">
                    <div className="flex items-center gap-2 text-xs font-bold tracking-wider text-primary uppercase">
                        <SlidersHorizontal className="size-4" />
                        <span>Host Announcer Settings</span>
                    </div>
                    <DialogTitle className="text-xl font-bold">
                        Announcement Queue & Sorting Settings
                    </DialogTitle>
                    <DialogDescription className="text-xs text-muted-foreground">
                        Configure the ordering sequence, queue inclusion
                        filters, and popup interaction behavior for stage
                        announcements.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col gap-6 py-4 text-sm">
                    {/* Primary Sorting Sequence */}
                    <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                            <Label className="text-xs font-bold tracking-wide text-neutral-800 uppercase dark:text-neutral-200">
                                1. Primary Announcement Order
                            </Label>
                            <span className="text-[11px] text-muted-foreground">
                                Determines which guest appears next in the popup
                            </span>
                        </div>

                        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                            {SORT_OPTIONS.map((opt) => {
                                const IconComponent = opt.icon;
                                const isSelected = draft.sortMode === opt.mode;

                                return (
                                    <button
                                        key={opt.mode}
                                        type="button"
                                        onClick={() =>
                                            setDraft({
                                                ...draft,
                                                sortMode: opt.mode,
                                            })
                                        }
                                        className={`flex items-start gap-3 rounded-xl border p-3.5 text-left transition-all ${
                                            isSelected
                                                ? 'border-primary bg-primary/5 ring-2 ring-primary/20 dark:bg-primary/10'
                                                : 'border-neutral-200 bg-neutral-50/50 hover:bg-neutral-100/70 dark:border-neutral-800 dark:bg-neutral-900/50 dark:hover:bg-neutral-800/60'
                                        }`}
                                    >
                                        <div
                                            className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${
                                                isSelected
                                                    ? 'bg-primary text-primary-foreground'
                                                    : 'bg-neutral-200 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300'
                                            }`}
                                        >
                                            <IconComponent className="size-4" />
                                        </div>
                                        <div className="flex flex-col">
                                            <div className="flex items-center gap-1.5 font-semibold text-neutral-900 dark:text-white">
                                                <span>{opt.label}</span>
                                                {opt.mode === 'protocol' && (
                                                    <span className="py-0.2 rounded bg-primary/15 px-1.5 text-[10px] font-bold text-primary">
                                                        Recommended
                                                    </span>
                                                )}
                                            </div>
                                            <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
                                                {opt.description}
                                            </p>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Queue Scope & Status Filter */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        {/* Status Filter */}
                        <div className="flex flex-col gap-2">
                            <Label className="text-xs font-bold tracking-wide text-neutral-800 uppercase dark:text-neutral-200">
                                2. Queue Status Filter
                            </Label>
                            <div className="grid grid-cols-3 gap-1 rounded-xl border border-neutral-200 bg-neutral-100 p-1 dark:border-neutral-800 dark:bg-neutral-900">
                                <button
                                    type="button"
                                    onClick={() =>
                                        setDraft({
                                            ...draft,
                                            statusFilter: 'pending',
                                        })
                                    }
                                    className={`rounded-lg py-1.5 text-xs font-semibold transition-all ${
                                        draft.statusFilter === 'pending'
                                            ? 'bg-white text-neutral-900 shadow-2xs dark:bg-neutral-800 dark:text-white'
                                            : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400'
                                    }`}
                                >
                                    Pending Only
                                </button>
                                <button
                                    type="button"
                                    onClick={() =>
                                        setDraft({
                                            ...draft,
                                            statusFilter: 'all',
                                        })
                                    }
                                    className={`rounded-lg py-1.5 text-xs font-semibold transition-all ${
                                        draft.statusFilter === 'all'
                                            ? 'bg-white text-neutral-900 shadow-2xs dark:bg-neutral-800 dark:text-white'
                                            : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400'
                                    }`}
                                >
                                    All Guests
                                </button>
                                <button
                                    type="button"
                                    onClick={() =>
                                        setDraft({
                                            ...draft,
                                            statusFilter: 'called',
                                        })
                                    }
                                    className={`rounded-lg py-1.5 text-xs font-semibold transition-all ${
                                        draft.statusFilter === 'called'
                                            ? 'bg-white text-neutral-900 shadow-2xs dark:bg-neutral-800 dark:text-white'
                                            : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400'
                                    }`}
                                >
                                    Called Only
                                </button>
                            </div>
                            <p className="text-[11px] text-muted-foreground">
                                "Pending Only" automatically removes called
                                guests from the active pop-up queue.
                            </p>
                        </div>

                        {/* Attendance Mode Filter */}
                        <div className="flex flex-col gap-2">
                            <Label className="text-xs font-bold tracking-wide text-neutral-800 uppercase dark:text-neutral-200">
                                3. Attendance Mode
                            </Label>
                            <div className="grid grid-cols-3 gap-1 rounded-xl border border-neutral-200 bg-neutral-100 p-1 dark:border-neutral-800 dark:bg-neutral-900">
                                <button
                                    type="button"
                                    onClick={() =>
                                        setDraft({
                                            ...draft,
                                            attendanceFilter: 'all',
                                        })
                                    }
                                    className={`rounded-lg py-1.5 text-xs font-semibold transition-all ${
                                        draft.attendanceFilter === 'all'
                                            ? 'bg-white text-neutral-900 shadow-2xs dark:bg-neutral-800 dark:text-white'
                                            : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400'
                                    }`}
                                >
                                    All Guests
                                </button>
                                <button
                                    type="button"
                                    onClick={() =>
                                        setDraft({
                                            ...draft,
                                            attendanceFilter: 'in_person',
                                        })
                                    }
                                    className={`rounded-lg py-1.5 text-xs font-semibold transition-all ${
                                        draft.attendanceFilter === 'in_person'
                                            ? 'bg-white text-neutral-900 shadow-2xs dark:bg-neutral-800 dark:text-white'
                                            : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400'
                                    }`}
                                >
                                    In-Person
                                </button>
                                <button
                                    type="button"
                                    onClick={() =>
                                        setDraft({
                                            ...draft,
                                            attendanceFilter: 'represented',
                                        })
                                    }
                                    className={`rounded-lg py-1.5 text-xs font-semibold transition-all ${
                                        draft.attendanceFilter === 'represented'
                                            ? 'bg-white text-neutral-900 shadow-2xs dark:bg-neutral-800 dark:text-white'
                                            : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400'
                                    }`}
                                >
                                    Proxy Reps
                                </button>
                            </div>
                            <p className="text-[11px] text-muted-foreground">
                                Choose whether to announce proxy representatives
                                or strictly in-person attendees.
                            </p>
                        </div>
                    </div>

                    {/* Category Filter */}
                    <div className="flex flex-col gap-2">
                        <Label className="text-xs font-bold tracking-wide text-neutral-800 uppercase dark:text-neutral-200">
                            4. Category Scope
                        </Label>
                        <select
                            value={draft.selectedCategoryId}
                            onChange={(e) => {
                                const val =
                                    e.target.value === 'all'
                                        ? 'all'
                                        : Number(e.target.value);
                                setDraft({ ...draft, selectedCategoryId: val });
                            }}
                            className="rounded-xl border border-neutral-300 bg-white px-3.5 py-2.5 text-xs font-medium text-neutral-800 shadow-2xs focus:border-primary focus:ring-1 focus:ring-primary dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200"
                        >
                            <option value="all">
                                All Categories (Entire Event Queue)
                            </option>
                            {categories.map((c) => (
                                <option key={c.id} value={c.id}>
                                    Category: {c.name}{' '}
                                    {c.order ? `(Protocol #${c.order})` : ''}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Interaction & Sound Preferences */}
                    <div className="rounded-xl border border-neutral-200 bg-neutral-50/60 p-4 dark:border-neutral-800 dark:bg-neutral-900/40">
                        <div className="flex flex-col gap-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
                                        {draft.soundEnabled ? (
                                            <Volume2 className="size-4" />
                                        ) : (
                                            <VolumeX className="size-4" />
                                        )}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-xs font-bold text-neutral-900 dark:text-white">
                                            Stage Chime on Double-Tap
                                        </span>
                                        <span className="text-[11px] text-muted-foreground">
                                            Plays a pleasant 2-tone melodic
                                            harmonic when a guest is called
                                        </span>
                                    </div>
                                </div>
                                <Switch
                                    checked={draft.soundEnabled}
                                    onCheckedChange={(checked) =>
                                        setDraft({
                                            ...draft,
                                            soundEnabled: checked,
                                        })
                                    }
                                />
                            </div>

                            {/* Auto Pop-up on New Registration */}
                            <div className="border-t border-neutral-200/60 pt-3 dark:border-neutral-800/60">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary dark:bg-primary/20">
                                            <Sparkles className="size-4" />
                                        </div>
                                        <div className="flex flex-col">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-bold text-neutral-900 dark:text-white">
                                                    Auto Pop-up on New
                                                    Registration
                                                </span>
                                                <span className="py-0.2 rounded bg-emerald-500/15 px-1.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
                                                    Live 5s Polling
                                                </span>
                                            </div>
                                            <span className="text-[11px] text-muted-foreground">
                                                Automatically queries the server
                                                every 5 seconds and pops up the
                                                announcement modal when a new
                                                guest registers
                                            </span>
                                        </div>
                                    </div>
                                    <Switch
                                        checked={
                                            draft.autoPopupNewRegistrations
                                        }
                                        onCheckedChange={(checked) =>
                                            setDraft({
                                                ...draft,
                                                autoPopupNewRegistrations:
                                                    checked,
                                            })
                                        }
                                    />
                                </div>
                            </div>

                            <div className="border-t border-neutral-200/60 pt-3 dark:border-neutral-800/60">
                                <div className="flex items-center justify-between">
                                    <div className="flex flex-col">
                                        <span className="text-xs font-bold text-neutral-900 dark:text-white">
                                            Modal Close-to-Next Transition Delay
                                        </span>
                                        <span className="text-[11px] text-muted-foreground">
                                            Time between modal close and opening
                                            the next guest popup
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        {[
                                            { label: 'Fast (150ms)', val: 150 },
                                            {
                                                label: 'Normal (250ms)',
                                                val: 250,
                                            },
                                            {
                                                label: 'Deliberate (450ms)',
                                                val: 450,
                                            },
                                        ].map((t) => (
                                            <button
                                                key={t.val}
                                                type="button"
                                                onClick={() =>
                                                    setDraft({
                                                        ...draft,
                                                        autoAdvanceDelay: t.val,
                                                    })
                                                }
                                                className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-all ${
                                                    draft.autoAdvanceDelay ===
                                                    t.val
                                                        ? 'bg-primary text-primary-foreground shadow-2xs'
                                                        : 'border border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300'
                                                }`}
                                            >
                                                {t.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <DialogFooter className="flex flex-col-reverse gap-2 border-t border-neutral-100 pt-3 sm:flex-row sm:items-center sm:justify-between dark:border-neutral-800">
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleReset}
                        className="gap-1.5 text-xs text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
                    >
                        <RotateCcw className="size-3.5" />
                        <span>Reset Defaults</span>
                    </Button>

                    <div className="flex items-center gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => onOpenChange(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            size="sm"
                            onClick={handleApply}
                            className="bg-primary font-semibold text-primary-foreground"
                        >
                            Save & Apply Settings
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
