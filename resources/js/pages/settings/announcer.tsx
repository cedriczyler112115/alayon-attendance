import { Head } from '@inertiajs/react';
import {
    Clock,
    Flame,
    Layers,
    Play,
    RefreshCw,
    RotateCcw,
    Save,
    Sparkles,
    Volume2,
    VolumeX,
    Zap,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
    DEFAULT_HOST_SETTINGS,
    type HostAnnouncerSettings,
    loadHostAnnouncerSettings,
    playAnnouncementChime,
    playNewRegistrationChime,
    saveHostAnnouncerSettings,
} from '@/lib/host-announcer-utils';

const TRANSITION_PRESETS = [
    { label: 'Ultra Fast', val: 100 },
    { label: 'Fast', val: 150 },
    { label: 'Standard (Default)', val: 250 },
    { label: 'Smooth', val: 400 },
    { label: 'Deliberate', val: 600 },
];

const POLLING_PRESETS = [
    { label: '3s (Ultra Responsive)', val: 3000 },
    { label: '5s (Standard Recommended)', val: 5000 },
    { label: '10s (Bandwidth Saver)', val: 10000 },
];

export default function AnnouncerSettings() {
    const [settings, setSettings] = useState<HostAnnouncerSettings>(() =>
        loadHostAnnouncerSettings(),
    );
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Keep updated if another tab modifies settings
    useEffect(() => {
        const handleSync = () => {
            setSettings(loadHostAnnouncerSettings());
            setHasUnsavedChanges(false);
        };
        window.addEventListener('storage', handleSync);
        window.addEventListener('alayon:host-settings-updated', handleSync);
        return () => {
            window.removeEventListener('storage', handleSync);
            window.removeEventListener(
                'alayon:host-settings-updated',
                handleSync,
            );
        };
    }, []);

    const updateField = <K extends keyof HostAnnouncerSettings>(
        field: K,
        value: HostAnnouncerSettings[K],
    ) => {
        setSettings((prev) => ({
            ...prev,
            [field]: value,
        }));
        setHasUnsavedChanges(true);
    };

    const handleSave = () => {
        setIsSaving(true);
        try {
            saveHostAnnouncerSettings(settings);
            setHasUnsavedChanges(false);
            toast.success(
                'Announcer settings saved and synchronized live with the Host Console!',
            );
        } catch {
            toast.error('Failed to save settings.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleReset = () => {
        setSettings({
            ...DEFAULT_HOST_SETTINGS,
        });
        setHasUnsavedChanges(true);
        toast.info(
            'Settings reset to default values. Click "Save Settings" to apply.',
        );
    };

    return (
        <>
            <Head title="Announcer Settings" />

            <div className="space-y-6">
                <Heading
                    variant="small"
                    title="Announcer Settings"
                    description="Configure stage announcement audio chimes, modal transition delays, and auto pop-up behavior for the Host Console."
                />

                {/* Section 1: Audio & Sound Feedback */}
                <Card className="rounded-2xl border-neutral-200/80 shadow-xs dark:border-neutral-800">
                    <CardHeader className="pb-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
                                    <Volume2 className="size-5" />
                                </div>
                                <div>
                                    <CardTitle className="text-base font-bold text-neutral-900 dark:text-white">
                                        Stage Chime & Audio Feedback
                                    </CardTitle>
                                    <CardDescription className="text-xs">
                                        Synthesized melodic chimes played during
                                        pop-up modal triggers and announcements.
                                    </CardDescription>
                                </div>
                            </div>
                            <Badge
                                variant="outline"
                                className={
                                    settings.soundEnabled
                                        ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                        : 'border-neutral-200 bg-neutral-100 text-neutral-500 dark:border-neutral-800 dark:bg-neutral-800'
                                }
                            >
                                {settings.soundEnabled
                                    ? 'Chimes Active'
                                    : 'Muted'}
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex flex-col gap-4 rounded-xl border border-neutral-200/80 bg-neutral-50/60 p-4 dark:border-neutral-800 dark:bg-neutral-900/40">
                            <div className="flex items-center justify-between gap-4">
                                <div className="space-y-1">
                                    <Label
                                        htmlFor="sound-toggle"
                                        className="text-sm font-semibold text-neutral-900 dark:text-white"
                                    >
                                        Stage Chime on Pop-up & Calling
                                    </Label>
                                    <p className="text-xs text-muted-foreground">
                                        Plays a 2-tone melodic harmonic when an
                                        announcement modal pops up or when a
                                        guest is formally announced.
                                    </p>
                                </div>
                                <Switch
                                    id="sound-toggle"
                                    checked={settings.soundEnabled}
                                    onCheckedChange={(checked) =>
                                        updateField('soundEnabled', checked)
                                    }
                                />
                            </div>

                            {/* Audio Test Preview Controls */}
                            <div className="flex flex-wrap items-center gap-2 border-t border-neutral-200/60 pt-3 dark:border-neutral-800/60">
                                <span className="text-xs font-medium text-muted-foreground">
                                    Audio Preview:
                                </span>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => playAnnouncementChime()}
                                    className="h-8 gap-1.5 rounded-lg text-xs"
                                >
                                    <Play className="size-3 text-emerald-600 dark:text-emerald-400" />
                                    <span>Test Announcement Chime</span>
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => playNewRegistrationChime()}
                                    className="h-8 gap-1.5 rounded-lg text-xs"
                                >
                                    <Sparkles className="size-3 text-primary" />
                                    <span>Test Registration Fanfare</span>
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Section 2: Modal Close-to-Next Transition Delay */}
                <Card className="rounded-2xl border-neutral-200/80 shadow-xs dark:border-neutral-800">
                    <CardHeader className="pb-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="flex size-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400">
                                    <Clock className="size-5" />
                                </div>
                                <div>
                                    <CardTitle className="text-base font-bold text-neutral-900 dark:text-white">
                                        Modal Transition Delay (Milliseconds)
                                    </CardTitle>
                                    <CardDescription className="text-xs">
                                        Time between closing one announcement
                                        modal and automatically displaying the
                                        next guest pop-up.
                                    </CardDescription>
                                </div>
                            </div>
                            <Badge
                                variant="outline"
                                className="border-amber-500/30 bg-amber-500/10 font-mono text-xs text-amber-700 dark:text-amber-400"
                            >
                                {settings.autoAdvanceDelay} ms
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="rounded-xl border border-neutral-200/80 bg-neutral-50/60 p-4 dark:border-neutral-800 dark:bg-neutral-900/40">
                            <div className="space-y-3">
                                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                    <Label
                                        htmlFor="transition-delay"
                                        className="text-sm font-semibold text-neutral-900 dark:text-white"
                                    >
                                        Transition Duration
                                    </Label>
                                    <div className="flex items-center gap-2">
                                        <Input
                                            id="transition-delay"
                                            type="number"
                                            min={50}
                                            max={3000}
                                            step={25}
                                            value={settings.autoAdvanceDelay}
                                            onChange={(e) => {
                                                const val = parseInt(
                                                    e.target.value,
                                                    10,
                                                );
                                                if (!isNaN(val)) {
                                                    updateField(
                                                        'autoAdvanceDelay',
                                                        Math.max(
                                                            50,
                                                            Math.min(3000, val),
                                                        ),
                                                    );
                                                }
                                            }}
                                            className="h-8 w-24 rounded-lg text-center font-mono text-xs font-bold"
                                        />
                                        <span className="text-xs font-medium text-muted-foreground">
                                            milliseconds (ms)
                                        </span>
                                    </div>
                                </div>

                                <p className="text-xs text-muted-foreground">
                                    Recommended: <strong>250ms</strong> gives a
                                    fluid animation without feeling rushed or
                                    sluggish.
                                </p>

                                {/* Quick Presets */}
                                <div className="flex flex-wrap items-center gap-2 border-t border-neutral-200/60 pt-2 dark:border-neutral-800/60">
                                    <span className="text-xs font-medium text-muted-foreground">
                                        Presets:
                                    </span>
                                    {TRANSITION_PRESETS.map((p) => {
                                        const isSelected =
                                            settings.autoAdvanceDelay === p.val;
                                        return (
                                            <button
                                                key={p.val}
                                                type="button"
                                                onClick={() =>
                                                    updateField(
                                                        'autoAdvanceDelay',
                                                        p.val,
                                                    )
                                                }
                                                className={`rounded-lg px-3 py-1 text-xs font-semibold transition-all ${
                                                    isSelected
                                                        ? 'bg-primary text-primary-foreground shadow-2xs'
                                                        : 'border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300'
                                                }`}
                                            >
                                                {p.label} ({p.val}ms)
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Section 3: Automatic Pop-up Behavior */}
                <Card className="rounded-2xl border-neutral-200/80 shadow-xs dark:border-neutral-800">
                    <CardHeader className="pb-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary dark:bg-primary/20">
                                    <Sparkles className="size-5" />
                                </div>
                                <div>
                                    <CardTitle className="text-base font-bold text-neutral-900 dark:text-white">
                                        Automatic Pop-up on Queue Entry
                                    </CardTitle>
                                    <CardDescription className="text-xs">
                                        Immediately pop up the stage modal when
                                        there are pending guests in the
                                        Announcement Queue Sequence.
                                    </CardDescription>
                                </div>
                            </div>
                            <Badge
                                variant="outline"
                                className={
                                    settings.autoPopupNewRegistrations
                                        ? 'border-primary/30 bg-primary/10 text-primary'
                                        : 'border-neutral-200 bg-neutral-100 text-neutral-500 dark:border-neutral-800 dark:bg-neutral-800'
                                }
                            >
                                {settings.autoPopupNewRegistrations
                                    ? 'Auto Pop-up Enabled'
                                    : 'Manual Trigger Only'}
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex flex-col gap-4 rounded-xl border border-neutral-200/80 bg-neutral-50/60 p-4 dark:border-neutral-800 dark:bg-neutral-900/40">
                            <div className="flex items-center justify-between gap-4">
                                <div className="space-y-1">
                                    <Label
                                        htmlFor="auto-popup-toggle"
                                        className="text-sm font-semibold text-neutral-900 dark:text-white"
                                    >
                                        Auto Pop-up Announcement Modal
                                    </Label>
                                    <p className="text-xs text-muted-foreground">
                                        When checked, the Host Console
                                        automatically pops up the announcement
                                        modal for the top guest in queue so the
                                        announcer can call them immediately
                                        without having to click anything or
                                        refresh.
                                    </p>
                                </div>
                                <Switch
                                    id="auto-popup-toggle"
                                    checked={settings.autoPopupNewRegistrations}
                                    onCheckedChange={(checked) =>
                                        updateField(
                                            'autoPopupNewRegistrations',
                                            checked,
                                        )
                                    }
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Section 4: Live Polling Interval */}
                <Card className="rounded-2xl border-neutral-200/80 shadow-xs dark:border-neutral-800">
                    <CardHeader className="pb-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="flex size-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400">
                                    <RefreshCw className="size-5" />
                                </div>
                                <div>
                                    <CardTitle className="text-base font-bold text-neutral-900 dark:text-white">
                                        Background Polling Frequency
                                    </CardTitle>
                                    <CardDescription className="text-xs">
                                        Controls how frequently the host console
                                        checks for newly registered guests or
                                        queue changes.
                                    </CardDescription>
                                </div>
                            </div>
                            <Badge
                                variant="outline"
                                className="border-blue-500/30 bg-blue-500/10 font-mono text-xs text-blue-700 dark:text-blue-400"
                            >
                                {(settings.pollingInterval / 1000).toFixed(0)}s
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="rounded-xl border border-neutral-200/80 bg-neutral-50/60 p-4 dark:border-neutral-800 dark:bg-neutral-900/40">
                            <div className="space-y-3">
                                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                    <Label
                                        htmlFor="polling-interval"
                                        className="text-sm font-semibold text-neutral-900 dark:text-white"
                                    >
                                        Polling Refresh Interval
                                    </Label>
                                    <div className="flex items-center gap-2">
                                        <Input
                                            id="polling-interval"
                                            type="number"
                                            min={1000}
                                            max={60000}
                                            step={1000}
                                            value={settings.pollingInterval}
                                            onChange={(e) => {
                                                const val = parseInt(
                                                    e.target.value,
                                                    10,
                                                );
                                                if (!isNaN(val)) {
                                                    updateField(
                                                        'pollingInterval',
                                                        Math.max(
                                                            1000,
                                                            Math.min(
                                                                60000,
                                                                val,
                                                            ),
                                                        ),
                                                    );
                                                }
                                            }}
                                            className="h-8 w-24 rounded-lg text-center font-mono text-xs font-bold"
                                        />
                                        <span className="text-xs font-medium text-muted-foreground">
                                            milliseconds (ms)
                                        </span>
                                    </div>
                                </div>

                                {/* Polling Presets */}
                                <div className="flex flex-wrap items-center gap-2 border-t border-neutral-200/60 pt-2 dark:border-neutral-800/60">
                                    <span className="text-xs font-medium text-muted-foreground">
                                        Presets:
                                    </span>
                                    {POLLING_PRESETS.map((p) => {
                                        const isSelected =
                                            settings.pollingInterval === p.val;
                                        return (
                                            <button
                                                key={p.val}
                                                type="button"
                                                onClick={() =>
                                                    updateField(
                                                        'pollingInterval',
                                                        p.val,
                                                    )
                                                }
                                                className={`rounded-lg px-3 py-1 text-xs font-semibold transition-all ${
                                                    isSelected
                                                        ? 'bg-primary text-primary-foreground shadow-2xs'
                                                        : 'border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300'
                                                }`}
                                            >
                                                {p.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Bottom Action Bar */}
                <div className="flex flex-col-reverse gap-3 border-t border-neutral-200 pt-4 sm:flex-row sm:items-center sm:justify-between dark:border-neutral-800">
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleReset}
                        className="gap-2 text-xs text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
                    >
                        <RotateCcw className="size-3.5" />
                        <span>Reset Defaults</span>
                    </Button>

                    <div className="flex items-center gap-3">
                        {hasUnsavedChanges && (
                            <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
                                Unsaved changes
                            </span>
                        )}
                        <Button
                            type="button"
                            onClick={handleSave}
                            disabled={isSaving || !hasUnsavedChanges}
                            className="gap-2 rounded-xl bg-primary px-6 font-bold text-primary-foreground shadow-sm hover:bg-primary/90"
                        >
                            <Save className="size-4" />
                            <span>
                                {isSaving ? 'Saving...' : 'Save Settings'}
                            </span>
                        </Button>
                    </div>
                </div>
            </div>
        </>
    );
}

AnnouncerSettings.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Settings', href: '/settings' },
        { title: 'Announcer Settings', href: '/settings/announcer' },
    ],
};
