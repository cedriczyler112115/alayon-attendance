import {
    Building2,
    Calendar,
    Check,
    CheckCircle2,
    Crown,
    ExternalLink,
    Layers,
    Megaphone,
    Sparkles,
    UserCheck,
    Users,
    VolumeX,
    X,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    getAttendeePositionWithJurisdiction,
    getCategoryBadgeClass,
    getSortModeLabel,
    type HostAnnouncerSettings,
    isCategoryAllowedToCall,
    playAnnouncementChime,
} from '@/lib/host-announcer-utils';
import type { Attendee, GuestCategory } from '@/types';

type Props = {
    open: boolean;
    onClose: () => void;
    attendee: Attendee | null;
    queueIndex: number;
    queueTotal: number;
    onAnnounceAndNext: (attendee: Attendee) => void;
    onSkipNext?: () => void;
    onPrevious?: () => void;
    hasPrevious?: boolean;
    hasNext?: boolean;
    settings: HostAnnouncerSettings;
    categories?: GuestCategory[];
    isLiveNewRegistration?: boolean;
};

export function HostAnnouncementModal({
    open,
    onClose,
    attendee,
    queueIndex,
    queueTotal,
    onAnnounceAndNext,
    onSkipNext,
    onPrevious,
    hasPrevious,
    hasNext,
    settings,
    categories,
    isLiveNewRegistration = false,
}: Props) {
    const [isCalling, setIsCalling] = useState(false);
    const lastTapRef = useRef<number>(0);
    const isHandlingActionRef = useRef<boolean>(false);
    const lastChimedAttendeeRef = useRef<number | null>(null);

    // Play stage announcement chime whenever the modal pops up for an attendee
    useEffect(() => {
        if (open && attendee && settings.soundEnabled) {
            if (lastChimedAttendeeRef.current !== attendee.id) {
                lastChimedAttendeeRef.current = attendee.id;
                playAnnouncementChime();
            }
        } else if (!open) {
            lastChimedAttendeeRef.current = null;
        }
    }, [open, attendee?.id, settings.soundEnabled]);

    // Reset calling state when attendee or open status changes
    useEffect(() => {
        setIsCalling(false);
        isHandlingActionRef.current = false;
    }, [attendee?.id, open]);

    const triggerAnnounce = useCallback(() => {
        if (!attendee || isHandlingActionRef.current) return;
        isHandlingActionRef.current = true;
        setIsCalling(true);

        // Trigger action: marks as called, closes modal, and advances to next guest popup after transition delay
        onAnnounceAndNext(attendee);
    }, [attendee, onAnnounceAndNext]);

    // Handle touch end for mobile/tablet double-tap
    const handleTouchEnd = (e: React.TouchEvent) => {
        const now = Date.now();
        const diff = now - lastTapRef.current;
        if (diff > 0 && diff < 350) {
            // Double-tap detected on touch screen!
            e.preventDefault();
            triggerAnnounce();
        }
        lastTapRef.current = now;
    };

    // Handle desktop mouse double-click
    const handleDoubleClick = (e: React.MouseEvent) => {
        e.preventDefault();
        triggerAnnounce();
    };

    // Keyboard shortcuts (Enter or Space to Call & Next, Escape to Close, Arrows for prev/next)
    useEffect(() => {
        if (!open) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            // Don't trigger if typing in an input
            if (
                e.target instanceof HTMLInputElement ||
                e.target instanceof HTMLTextAreaElement
            ) {
                return;
            }

            if (e.key === ' ' || e.key === 'Enter') {
                e.preventDefault();
                triggerAnnounce();
            } else if (e.key === 'Escape') {
                e.preventDefault();
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [open, triggerAnnounce, onClose]);

    if (!open || !attendee) return null;

    const isAlreadyAnnounced = attendee.status === 'called';
    const categoryOrder =
        categories?.find((c) => c.id === attendee.category_id)?.order ??
        attendee.category?.order;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-3 sm:p-6">
            {/* Dark blur backdrop */}
            <div
                className="fixed inset-0 animate-in bg-neutral-950/80 backdrop-blur-md transition-opacity duration-200 fade-in"
                onClick={onClose}
            />

            {/* Announcement Card (1-by-1 Popup) */}
            <div
                onTouchEnd={handleTouchEnd}
                onDoubleClick={handleDoubleClick}
                className={`relative z-10 w-full max-w-3xl overflow-hidden rounded-3xl border-2 bg-white text-neutral-900 shadow-2xl transition-all select-none dark:bg-neutral-950 dark:text-white ${
                    isCalling
                        ? 'scale-102 border-emerald-500 ring-8 ring-emerald-500/30'
                        : 'border-primary/40 hover:border-primary/80 dark:border-primary/50'
                } animate-in cursor-pointer duration-200 zoom-in-95 fade-in`}
            >
                {/* Called Stamp Overlay on Double Tap */}
                {isCalling && (
                    <div className="absolute inset-0 z-20 flex animate-in flex-col items-center justify-center bg-emerald-600/90 text-white backdrop-blur-xs duration-150 zoom-in-75">
                        <div className="flex size-20 items-center justify-center rounded-full bg-white text-emerald-600 shadow-xl">
                            <Check className="size-12 stroke-[3]" />
                        </div>
                        <h2 className="mt-4 text-3xl font-black tracking-wider uppercase">
                            CALLED & ANNOUNCED!
                        </h2>
                        <p className="mt-1 text-sm font-semibold opacity-90">
                            Broadcasting to Big Screen Display...
                        </p>
                    </div>
                )}

                {/* Top Ambient Glow / Stage Header Bar */}
                <div className="relative border-b border-neutral-200 bg-neutral-50 px-6 py-4 dark:border-neutral-800 dark:bg-neutral-900/60">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <span className="flex size-3 animate-ping rounded-full bg-red-500" />
                            <div className="flex items-center gap-1.5 text-xs font-black tracking-wider text-primary uppercase">
                                <Megaphone className="size-4" />
                                <span>ANNOUNCEMENT</span>
                            </div>
                        </div>

                        {/* Queue Counter & Close */}
                        <div className="flex items-center gap-2 sm:gap-3">
                            <span className="hidden items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-bold text-primary sm:inline-flex dark:bg-primary/20">
                                <Layers className="size-3" />
                                <span>
                                    {getSortModeLabel(settings.sortMode)}
                                </span>
                            </span>
                            <span className="rounded-full bg-neutral-200/80 px-3 py-1 text-xs font-bold text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
                                Guest {queueIndex + 1} of {queueTotal}
                            </span>
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onClose();
                                }}
                                className="flex size-8 items-center justify-center rounded-full text-neutral-400 hover:bg-neutral-200 hover:text-neutral-900 dark:hover:bg-neutral-800 dark:hover:text-white"
                                title="Close popup (Esc)"
                            >
                                <X className="size-4" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Main Guest Details Body */}
                <div className="flex flex-col gap-6 p-6 sm:p-10">
                    {/* Guest Details */}
                    <div>
                        {/* Category & Status Badges - directly above the name of guest */}
                        <div className="mb-3 flex flex-wrap items-center gap-2">
                            {isLiveNewRegistration && (
                                <Badge className="animate-bounce gap-1 bg-amber-500 text-xs font-black text-neutral-950 shadow-md shadow-amber-500/30 hover:bg-amber-600">
                                    <Sparkles className="size-3.5 fill-current" />
                                    <span>JUST REGISTERED (LIVE ARRIVAL)</span>
                                </Badge>
                            )}

                            <Badge
                                variant="outline"
                                className={`px-3.5 py-1 text-xs font-bold tracking-wide uppercase ${getCategoryBadgeClass(
                                    attendee.category?.slug,
                                )}`}
                            >
                                {attendee.category?.name || 'Guest Official'}
                            </Badge>

                            {categoryOrder != null && (
                                <span className="inline-flex items-center gap-1 rounded-md bg-neutral-100 px-2 py-0.5 text-[11px] font-semibold text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
                                    <Crown className="size-3 text-amber-500" />
                                    <span>Protocol Order #{categoryOrder}</span>
                                </span>
                            )}

                            {!isCategoryAllowedToCall(attendee, categories) && (
                                <Badge
                                    variant="outline"
                                    className="gap-1 border-rose-400 bg-rose-50 text-xs font-bold text-rose-700 dark:bg-rose-950/60 dark:text-rose-300"
                                >
                                    <VolumeX className="size-3" />
                                    <span>Excluded from Modal Call</span>
                                </Badge>
                            )}

                            {isAlreadyAnnounced && (
                                <Badge className="gap-1 bg-emerald-600 text-xs font-bold text-white">
                                    <CheckCircle2 className="size-3.5" />
                                    <span>Already Called</span>
                                </Badge>
                            )}

                            {attendee.is_attending ? (
                                <Badge
                                    variant="outline"
                                    className="gap-1 border-green-500/30 bg-green-500/10 text-xs font-semibold text-green-700 dark:text-green-300"
                                >
                                    <UserCheck className="size-3.5" />
                                    <span>In Person</span>
                                </Badge>
                            ) : (
                                <Badge
                                    variant="outline"
                                    className="gap-1 border-amber-500/30 bg-amber-500/10 text-xs font-semibold text-amber-700 dark:text-amber-300"
                                >
                                    <Users className="size-3.5" />
                                    <span>Represented</span>
                                </Badge>
                            )}
                        </div>

                        {/* Guest Full Name & Prefix */}
                        <h1 className="text-3xl leading-tight font-black tracking-tight text-neutral-900 sm:text-4xl md:text-5xl dark:text-white">
                            {attendee.prefix_name
                                ? `${attendee.prefix_name} `
                                : ''}
                            {attendee.fullname || attendee.name}
                        </h1>

                        {/* Official Position / Designation concatenated with jurisdiction */}
                        <div className="mt-2 text-xl font-bold text-neutral-700 sm:text-2xl dark:text-neutral-300">
                            {getAttendeePositionWithJurisdiction(attendee)}
                        </div>
                    </div>

                    {/* Representative Information Callout */}
                    {!attendee.is_attending && attendee.rep_fullname && (
                        <div className="rounded-2xl border border-amber-400/40 bg-amber-500/10 p-4 dark:border-amber-500/30">
                            <div className="flex items-center gap-1.5 text-xs font-bold tracking-wider text-amber-800 uppercase dark:text-amber-300">
                                <Users className="size-3.5" />
                                <span>REPRESENTED BY</span>
                            </div>
                            <div className="mt-1 text-lg font-bold text-amber-950 dark:text-amber-200">
                                {attendee.rep_prefix_name
                                    ? `${attendee.rep_prefix_name} `
                                    : ''}
                                {attendee.rep_fullname}
                            </div>
                            {attendee.rep_position && (
                                <div className="text-sm font-semibold text-amber-900/80 dark:text-amber-300/90">
                                    {attendee.rep_position}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Double-Tap Gesture Prompt Banner */}
                    <div className="flex items-center justify-center rounded-2xl border-2 border-dashed border-primary/40 bg-primary/5 px-4 py-3.5 text-center">
                        <div className="flex animate-pulse items-center gap-2 text-xs font-black tracking-wider text-primary uppercase">
                            <Sparkles className="size-4" />
                            <span>
                                DOUBLE-TAP ANYWHERE ON THIS CARD TO ANNOUNCE &
                                ADVANCE
                            </span>
                            <Sparkles className="size-4" />
                        </div>
                    </div>
                </div>

                {/* Footer Controls & Navigation */}
                <div
                    className="flex flex-col gap-3 border-t border-neutral-200 bg-neutral-50 p-4 sm:flex-row sm:items-center sm:justify-end dark:border-neutral-800 dark:bg-neutral-900/80"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="flex w-full items-center justify-end gap-2 sm:w-auto">
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={onClose}
                            className="text-xs text-muted-foreground hover:text-neutral-900 dark:hover:text-white"
                        >
                            Close (Esc)
                        </Button>

                        <Button
                            type="button"
                            size="default"
                            onClick={triggerAnnounce}
                            disabled={isCalling}
                            className="gap-2 bg-emerald-600 px-5 font-extrabold text-white shadow-lg shadow-emerald-600/25 hover:bg-emerald-700"
                        >
                            <Check className="size-4 stroke-[3]" />
                            <span>Call & Next (Double Tap)</span>
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
