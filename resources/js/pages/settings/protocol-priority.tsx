import { Head, router } from '@inertiajs/react';
import {
    ArrowDown,
    ArrowUp,
    Check,
    CheckSquare2,
    Crown,
    Layers,
    Megaphone,
    RotateCcw,
    Save,
    Sparkles,
    Square,
    Tag,
    Users,
    Volume2,
    VolumeX,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { getCategoryCustomField } from '@/lib/category-custom-fields';
import { getCategoryBadgeClass } from '@/lib/host-announcer-utils';
import type { GuestCategory } from '@/types';

type CategoryWithCount = GuestCategory & {
    attendees_count?: number;
};

type Props = {
    categories: CategoryWithCount[];
    status?: string;
};

// Standard Philippine government & stakeholder protocol ranking default sequence
const DEFAULT_PROTOCOL_ORDER_SLUGS = [
    'governors',
    'mayors',
    'pswdo',
    'cswdo',
    'ngas',
    'lbp-manager',
    'csos',
    'media-partners',
    '4ps-coordinators',
    'lgu-links',
    'npmo-guest',
    'rmancom',
];

export default function ProtocolPrioritySettings({ categories: initialCategories }: Props) {
    const [categories, setCategories] = useState<CategoryWithCount[]>(() => {
        return [...initialCategories]
            .map((cat) => ({ ...cat, allow_call: cat.allow_call !== false }))
            .sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
    });
    const [isSaving, setIsSaving] = useState(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

    // Toggle whether a category is allowed to pop up in the host call modal
    const handleToggleAllowCall = (id: number) => {
        setCategories((prev) =>
            prev.map((cat) => {
                if (cat.id === id) {
                    const nextAllow = !(cat.allow_call !== false);
                    return { ...cat, allow_call: nextAllow };
                }
                return cat;
            })
        );
        setHasUnsavedChanges(true);
    };

    // Bulk allow or disallow all categories to call
    const handleSetAllAllowCall = (allow: boolean) => {
        setCategories((prev) => prev.map((cat) => ({ ...cat, allow_call: allow })));
        setHasUnsavedChanges(true);
    };

    // Move category up one position in the sequence
    const handleMoveUp = (index: number) => {
        if (index <= 0) return;
        setCategories((prev) => {
            const next = [...prev];
            const temp = next[index];
            next[index] = next[index - 1];
            next[index - 1] = temp;
            return next.map((cat, i) => ({ ...cat, order: i + 1 }));
        });
        setHasUnsavedChanges(true);
    };

    // Move category down one position in the sequence
    const handleMoveDown = (index: number) => {
        if (index >= categories.length - 1) return;
        setCategories((prev) => {
            const next = [...prev];
            const temp = next[index];
            next[index] = next[index + 1];
            next[index + 1] = temp;
            return next.map((cat, i) => ({ ...cat, order: i + 1 }));
        });
        setHasUnsavedChanges(true);
    };

    // Change position directly via rank select
    const handleRankChange = (currentIndex: number, targetRank: number) => {
        const targetIndex = targetRank - 1;
        if (targetIndex === currentIndex || targetIndex < 0 || targetIndex >= categories.length) return;

        setCategories((prev) => {
            const next = [...prev];
            const [item] = next.splice(currentIndex, 1);
            next.splice(targetIndex, 0, item);
            return next.map((cat, i) => ({ ...cat, order: i + 1 }));
        });
        setHasUnsavedChanges(true);
    };

    // Reset sequence to default protocol hierarchy with all categories allowed to call
    const handleResetToDefault = () => {
        setCategories((prev) => {
            const sorted = [...prev].sort((a, b) => {
                const idxA = DEFAULT_PROTOCOL_ORDER_SLUGS.indexOf(a.slug || '');
                const idxB = DEFAULT_PROTOCOL_ORDER_SLUGS.indexOf(b.slug || '');
                const rankA = idxA >= 0 ? idxA : 999;
                const rankB = idxB >= 0 ? idxB : 999;
                if (rankA !== rankB) return rankA - rankB;
                return a.name.localeCompare(b.name);
            });
            return sorted.map((cat, i) => ({ ...cat, order: i + 1, allow_call: true }));
        });
        setHasUnsavedChanges(true);
        toast.info('Sequence reset to default protocol hierarchy with all categories allowed to call. Click "Save Sequence" to apply.');
    };

    // Save sequence and allow_call settings to backend database
    const handleSave = () => {
        setIsSaving(true);
        const payload = {
            categories: categories.map((cat, idx) => ({
                id: cat.id,
                order: idx + 1,
                allow_call: cat.allow_call !== false,
            })),
        };

        router.put('/settings/protocol-priority', payload, {
            preserveScroll: true,
            onSuccess: () => {
                setIsSaving(false);
                setHasUnsavedChanges(false);
                toast.success('Protocol Priority sequence and modal call settings saved successfully!');
            },
            onError: () => {
                setIsSaving(false);
                toast.error('Failed to save Protocol Priority settings.');
            },
        });
    };

    const allowedCount = categories.filter((c) => c.allow_call !== false).length;

    return (
        <>
            <Head title="Protocol Priority Sorting by Category" />

            <div className="space-y-6 w-full">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <Heading
                        variant="small"
                        title="Protocol Priority Sorting by Category"
                        description="Arrange the sequence order of guest categories and configure which categories are permitted to pop up in the /host stage call modal."
                    />

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleSetAllAllowCall(true)}
                            disabled={isSaving}
                            className="gap-1.5 rounded-xl text-xs font-semibold text-emerald-700 dark:text-emerald-400"
                            title="Allow all categories to be called in popup modal"
                        >
                            <CheckSquare2 className="size-3.5" />
                            <span>Allow All</span>
                        </Button>

                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleResetToDefault}
                            disabled={isSaving}
                            className="gap-1.5 rounded-xl text-xs font-semibold"
                        >
                            <RotateCcw className="size-3.5" />
                            <span>Reset Default</span>
                        </Button>

                        <Button
                            type="button"
                            size="sm"
                            onClick={handleSave}
                            disabled={isSaving || !hasUnsavedChanges}
                            className="gap-1.5 rounded-xl bg-primary text-primary-foreground font-bold shadow-xs hover:bg-primary/90"
                        >
                            <Save className="size-3.5" />
                            <span>{isSaving ? 'Saving...' : 'Save Sequence'}</span>
                        </Button>
                    </div>
                </div>

                {hasUnsavedChanges && (
                    <div className="flex items-center justify-between gap-3 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-amber-950 dark:text-amber-100">
                        <div className="flex items-center gap-2">
                            <Sparkles className="size-4 text-amber-600 animate-pulse shrink-0" />
                            <span>You have unsaved sequence and call modal changes. Click <strong>Save Sequence</strong> to apply them.</span>
                        </div>
                        <Button
                            size="sm"
                            onClick={handleSave}
                            disabled={isSaving}
                            className="h-7 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs"
                        >
                            Save Now
                        </Button>
                    </div>
                )}

                {/* Sequence Overview Bar */}
                <Card className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/40">
                    <CardHeader className="p-4 pb-2">
                        <div className="flex items-center justify-between gap-2">
                            <CardTitle className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                <Crown className="size-3.5 text-amber-500" />
                                <span>Active Announcement Sequence Preview</span>
                            </CardTitle>
                            <Badge variant="outline" className="text-[11px] font-mono font-bold">
                                {allowedCount} of {categories.length} Allowed in Modal
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                        <div className="flex flex-wrap items-center gap-1.5 text-xs font-medium">
                            {categories.map((cat, idx) => {
                                const isAllowed = cat.allow_call !== false;
                                return (
                                    <div key={cat.id} className="flex items-center gap-1.5">
                                        <span
                                            className={`inline-flex items-center gap-1.5 rounded-lg border px-2 py-1 font-bold shadow-2xs transition-opacity ${
                                                isAllowed
                                                    ? 'border-neutral-200 bg-white text-neutral-800 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200'
                                                    : 'border-dashed border-rose-300 bg-rose-50/70 text-neutral-400 line-through dark:border-rose-900/60 dark:bg-rose-950/20'
                                            }`}
                                            title={isAllowed ? `${cat.name} (Allowed to Call)` : `${cat.name} (Excluded from Popup Modal)`}
                                        >
                                            <span className="text-[10px] text-primary font-mono font-black">#{idx + 1}</span>
                                            <span>{cat.name}</span>
                                            {!isAllowed && (
                                                <span className="rounded bg-rose-100 px-1 text-[9px] font-black uppercase tracking-wider text-rose-700 not-italic no-underline dark:bg-rose-900/50 dark:text-rose-300">
                                                    Off
                                                </span>
                                            )}
                                        </span>
                                        {idx < categories.length - 1 && (
                                            <span className="text-neutral-400 font-bold">→</span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>

                {/* Category Ordering List */}
                <div className="space-y-2.5">
                    {categories.map((category, index) => {
                        const customField = getCategoryCustomField(category);
                        const isTop = index === 0;
                        const isBottom = index === categories.length - 1;
                        const isAllowedToCall = category.allow_call !== false;

                        return (
                            <div
                                key={category.id}
                                className={`flex flex-col lg:flex-row lg:items-center justify-between gap-3 rounded-2xl border p-4 transition-all ${
                                    index === 0
                                        ? 'border-amber-500/40 bg-amber-500/5 dark:bg-amber-500/10 shadow-xs'
                                        : 'border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900'
                                }`}
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    {/* Sequence Number / Rank Badge */}
                                    <div
                                        className={`flex size-10 shrink-0 items-center justify-center rounded-xl font-mono text-sm font-black ${
                                            index === 0
                                                ? 'bg-amber-500 text-white shadow-sm ring-4 ring-amber-500/20'
                                                : index === 1
                                                ? 'bg-primary/20 text-primary'
                                                : 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300'
                                        }`}
                                    >
                                        #{index + 1}
                                    </div>

                                    {/* Category Info */}
                                    <div className="flex flex-col min-w-0">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="font-extrabold text-sm sm:text-base text-neutral-900 dark:text-white">
                                                {category.name}
                                            </span>

                                            <Badge
                                                variant="outline"
                                                className={`text-[11px] font-bold ${getCategoryBadgeClass(category.slug)}`}
                                            >
                                                {category.scope ? `${category.scope.toUpperCase()}` : 'GENERAL'}
                                            </Badge>

                                            {customField && (
                                                <span className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary dark:bg-primary/20">
                                                    <span>Field: {customField.label}</span>
                                                </span>
                                            )}

                                            {index === 0 && (
                                                <Badge className="bg-amber-500 text-white font-black text-[10px] gap-1 shadow-2xs">
                                                    <Crown className="size-2.5" />
                                                    <span>HIGHEST VIP PRIORITY</span>
                                                </Badge>
                                            )}
                                        </div>

                                        <div className="mt-0.5 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                                            {category.description && (
                                                <span className="truncate max-w-md">{category.description}</span>
                                            )}
                                            {typeof category.attendees_count === 'number' && (
                                                <span className="inline-flex items-center gap-1 font-semibold text-neutral-600 dark:text-neutral-400">
                                                    <Users className="size-3" />
                                                    <span>{category.attendees_count} Registered Guests</span>
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Controls: Allow to Call Checkbox + Order Adjustment */}
                                <div className="flex flex-wrap items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 lg:pt-0 border-t border-neutral-100 lg:border-t-0 dark:border-neutral-800">
                                    {/* Checkbox: Allow to Call in Popup Modal */}
                                    <label
                                        htmlFor={`allow-call-${category.id}`}
                                        className={`flex items-center gap-2.5 rounded-xl border px-3 py-1.5 text-xs font-semibold cursor-pointer transition-all select-none ${
                                            isAllowedToCall
                                                ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-950 hover:bg-emerald-500/15 dark:border-emerald-500/40 dark:bg-emerald-950/30 dark:text-emerald-300'
                                                : 'border-neutral-300 bg-neutral-100/90 text-neutral-500 hover:bg-neutral-200/70 dark:border-neutral-700 dark:bg-neutral-800/80 dark:text-neutral-400'
                                        }`}
                                    >
                                        <Checkbox
                                            id={`allow-call-${category.id}`}
                                            checked={isAllowedToCall}
                                            onCheckedChange={() => handleToggleAllowCall(category.id)}
                                        />
                                        <div className="flex flex-col text-left">
                                            <span className="flex items-center gap-1 font-bold leading-tight">
                                                {isAllowedToCall ? (
                                                    <Megaphone className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                                                ) : (
                                                    <VolumeX className="size-3.5 text-neutral-400" />
                                                )}
                                                <span>Allow to call</span>
                                            </span>
                                            <span className="text-[10px] font-normal opacity-75 leading-tight mt-0.5">
                                                {isAllowedToCall ? 'Enabled in popup modal' : 'Excluded from popup modal'}
                                            </span>
                                        </div>
                                    </label>

                                    {/* Order Adjustment Controls */}
                                    <div className="flex items-center gap-2 shrink-0">
                                        {/* Direct Rank Selector */}
                                        <div className="flex items-center gap-1 text-xs">
                                            <span className="text-[11px] font-semibold text-muted-foreground hidden sm:inline">
                                                Rank:
                                            </span>
                                            <select
                                                value={index + 1}
                                                onChange={(e) => handleRankChange(index, Number(e.target.value))}
                                                className="h-8 rounded-lg border border-neutral-300 bg-white px-2 text-xs font-mono font-bold text-neutral-800 shadow-2xs dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200"
                                                title="Change sequence priority rank"
                                            >
                                                {categories.map((_, rIdx) => (
                                                    <option key={rIdx + 1} value={rIdx + 1}>
                                                        #{rIdx + 1}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Move Up */}
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="icon"
                                            disabled={isTop}
                                            onClick={() => handleMoveUp(index)}
                                            className="size-8 rounded-lg"
                                            title="Move Up in Priority"
                                        >
                                            <ArrowUp className="size-4" />
                                        </Button>

                                        {/* Move Down */}
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="icon"
                                            disabled={isBottom}
                                            onClick={() => handleMoveDown(index)}
                                            className="size-8 rounded-lg"
                                            title="Move Down in Priority"
                                        >
                                            <ArrowDown className="size-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Save CTA in bottom footer */}
                <div className="flex items-center justify-between pt-4 border-t border-neutral-200 dark:border-neutral-800">
                    <span className="text-xs text-muted-foreground font-medium">
                        {allowedCount} of {categories.length} Categories Permitted to Call in Modal
                    </span>

                    <Button
                        type="button"
                        onClick={handleSave}
                        disabled={isSaving || !hasUnsavedChanges}
                        className="gap-2 rounded-xl bg-primary px-6 font-bold text-primary-foreground shadow-sm hover:bg-primary/90"
                    >
                        <Save className="size-4" />
                        <span>{isSaving ? 'Saving...' : 'Save Sequence Changes'}</span>
                    </Button>
                </div>
            </div>
        </>
    );
}

ProtocolPrioritySettings.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Settings', href: '/settings' },
        { title: 'Protocol Priority Sorting by Category', href: '/settings/protocol-priority' },
    ],
};

