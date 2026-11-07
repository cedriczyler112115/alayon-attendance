import { Head, Link, router, useForm } from '@inertiajs/react';
import {
    Calendar,
    CheckCircle2,
    ChevronRight,
    Home,
    Landmark,
    LayoutGrid,
    MapPin,
    Save,
    Tag,
    UserCheck,
    Users,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select2 } from '@/components/ui/select2';
import { Spinner } from '@/components/ui/spinner';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import type { Attendee, BarangayItem, CityItem, EventItem, GuestCategory, ProvinceItem } from '@/types';

type Props = {
    event: EventItem;
    categories: GuestCategory[];
    provinces?: ProvinceItem[];
    events?: { id: number; title: string; event_date: string; venue?: string | null }[];
    status?: string;
    registeredAttendee?: Attendee | null;
};

const COMMON_PREFIXES = ['Hon.', 'Mr.', 'Ms.', 'Gov.', 'Mayor', 'Vice Gov.', 'Vice Mayor', 'Dir.', 'Sec.', 'Asec.', 'Atty.', 'Engr.', 'Dr.'];

const REP_PREFIXES = ['Mr.', 'Ms.', 'Hon.', 'Atty.', 'Engr.', 'Dr.'];

function getCategoryInfo(cat?: GuestCategory | null) {
    if (!cat) {
        return {
            isGov: false,
            isMayor: false,
            isGovOrMayor: false,
            isPswdo: false,
            isCswdo: false,
            isLguLink: false,
            isGovOrPswdo: false,
            isMayorOrCswdo: false,
            isProvinceRequired: false,
            isCityRequired: false,
        };
    }
    const slug = cat.slug?.toLowerCase() || '';
    const name = cat.name?.toLowerCase() || '';

    const isGov = slug === 'governors' || slug === 'governor' || name.includes('governor');
    const isMayor = slug === 'mayors' || slug === 'mayor' || name.includes('mayor');
    const isPswdo = slug === 'pswdo' || name.includes('pswdo');
    const isCswdo = slug === 'cswdo' || name.includes('cswdo');
    const isLguLink = slug === 'lgu-links' || slug === 'lgu_links' || name.includes('lgu link');

    const isGovOrPswdo = isGov || isPswdo;
    const isCityRequired = isMayor || isCswdo || isLguLink;
    const isProvinceRequired = isGovOrPswdo || isCityRequired;

    return {
        isGov,
        isMayor,
        isGovOrMayor: isGov || isMayor,
        isPswdo,
        isCswdo,
        isLguLink,
        isGovOrPswdo,
        isMayorOrCswdo: isMayor || isCswdo || isLguLink,
        isProvinceRequired,
        isCityRequired,
    };
}

export default function AttendanceRegister({
    event,
    categories,
    provinces: initialProvinces = [],
    events = [],
    status,
    registeredAttendee,
}: Props) {
    const initialCategory = categories[0];
    const initialInfo = getCategoryInfo(initialCategory);
    const [selectedCategory, setSelectedCategory] = useState<GuestCategory | undefined>(initialCategory);
    const [provincesList, setProvincesList] = useState<ProvinceItem[]>(initialProvinces);
    const [citiesList, setCitiesList] = useState<CityItem[]>([]);
    const [barangaysList, setBarangaysList] = useState<BarangayItem[]>([]);
    const [isLoadingCities, setIsLoadingCities] = useState(false);
    const [isLoadingBarangays, setIsLoadingBarangays] = useState(false);

    const { data, setData, post, processing, errors, reset, clearErrors, setError } = useForm({
        event_id: event.id,
        category_id: initialCategory?.id || 1,
        is_attending: false,
        prefix_name: initialInfo.isGovOrMayor ? 'Hon.' : 'Mr.',
        fullname: '',
        position: initialInfo.isGov
            ? 'Provincial Governor'
            : initialInfo.isMayor
              ? 'Municipal Mayor'
              : '',
        rep_prefix_name: 'Mr.',
        rep_fullname: '',
        rep_position: '',
        province_id: '' as string | number,
        city_id: '' as string | number,
        brgy_id: '' as string | number,
        status: 'registered',
    });

    useEffect(() => {
        if (provincesList.length === 0) {
            fetch('/api/locations/provinces?region_code=16')
                .then((res) => res.json())
                .then((d) => setProvincesList(d))
                .catch(() => {});
        }
    }, [provincesList.length]);

    // Region 16 Provinces (Caraga Region only)
    const region16Provinces = useMemo(() => {
        return provincesList.filter((p) => !p.region_code || Number(p.region_code) === 16);
    }, [provincesList]);

    // Cascading cities
    useEffect(() => {
        if (!data.province_id) {
            setCitiesList([]);
            setBarangaysList([]);
            setData((prev) => ({ ...prev, city_id: '', brgy_id: '' }));
            return;
        }

        setIsLoadingCities(true);
        fetch(`/api/locations/cities?province_id=${data.province_id}`)
            .then((res) => res.json())
            .then((cities) => {
                setCitiesList(cities);
                setIsLoadingCities(false);
            })
            .catch(() => setIsLoadingCities(false));
    }, [data.province_id]);

    // Cascading barangays
    useEffect(() => {
        if (!data.city_id) {
            setBarangaysList([]);
            setData((prev) => ({ ...prev, brgy_id: '' }));
            return;
        }

        setIsLoadingBarangays(true);
        fetch(`/api/locations/barangays?city_id=${data.city_id}`)
            .then((res) => res.json())
            .then((barangays) => {
                setBarangaysList(barangays);
                setIsLoadingBarangays(false);
            })
            .catch(() => setIsLoadingBarangays(false));
    }, [data.city_id]);

    const categoryInfo = useMemo(() => getCategoryInfo(selectedCategory), [selectedCategory]);

    const handleCategorySelect = (cat: GuestCategory) => {
        setSelectedCategory(cat);
        const info = getCategoryInfo(cat);

        let prefix_name = data.prefix_name;
        let position = '';

        if (info.isGovOrMayor) {
            prefix_name = 'Hon.';
            if (info.isGov) {
                position = 'Provincial Governor';
            } else {
                position = 'Municipal Mayor';
            }
        } else {
            position = '';
            if (prefix_name === 'Hon' || prefix_name === 'Hon.' || prefix_name === 'Honorable') {
                prefix_name = 'Mr.';
            }
        }

        setData((prev) => ({
            ...prev,
            category_id: cat.id,
            prefix_name,
            position,
            ...(info.isGovOrPswdo ? { city_id: '', brgy_id: '' } : {}),
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        let hasError = false;
        if (!data.position?.trim()) {
            setError('position', 'The official position / designation field is required.');
            hasError = true;
        }
        if (categoryInfo.isProvinceRequired && !data.province_id) {
            setError('province_id', 'The province field is required.');
            hasError = true;
        }
        if (categoryInfo.isCityRequired && !data.city_id) {
            setError('city_id', 'The city/municipality field is required.');
            hasError = true;
        }

        if (hasError) {
            toast.error('Please complete all required fields.');
            return;
        }

        post('/attendance', {
            preserveScroll: true,
            onSuccess: () => {
                reset('fullname', 'position', 'province_id', 'city_id', 'brgy_id', 'rep_fullname', 'rep_position');
                setData((prev) => ({
                    ...prev,
                    is_attending: false,
                    rep_prefix_name: 'Mr.',
                    rep_fullname: '',
                    rep_position: '',
                }));
            },
        });
    };

    // Select2 Options
    const eventOptions = useMemo(() => {
        return events.map((ev) => ({
            value: ev.id,
            label: ev.title,
        }));
    }, [events]);

    const prefixOptions = useMemo(() => {
        return COMMON_PREFIXES.map((p) => ({ value: p, label: p })).concat([
            { value: '', label: 'None' },
        ]);
    }, []);

    const repPrefixOptions = useMemo(() => {
        return REP_PREFIXES.map((p) => ({ value: p, label: p })).concat([
            { value: '', label: 'None' },
        ]);
    }, []);

    const provinceOptions = useMemo(() => {
        return region16Provinces.map((prv) => ({
            value: prv.prov_code,
            label: prv.prov_name,
        }));
    }, [region16Provinces]);

    const cityOptions = useMemo(() => {
        return citiesList.map((cty) => ({
            value: cty.city_code,
            label: cty.city_name,
        }));
    }, [citiesList]);

    const barangayOptions = useMemo(() => {
        return barangaysList.map((bgy) => ({
            value: bgy.brgy_code,
            label: bgy.brgy_name,
        }));
    }, [barangaysList]);

    return (
        <div className="min-h-screen bg-neutral-50 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">
            <Head title={`Attendance Registration - ${event.title}`} />

            {/* Header banner */}
            <header className="border-b border-neutral-200 bg-white shadow-xs dark:border-neutral-800 dark:bg-neutral-900">
                <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
                    <div className="flex items-center gap-3">
                        <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
                            <Landmark className="size-5" />
                        </div>
                        <div>
                            <span className="text-xs font-semibold tracking-wider text-primary uppercase">
                                Alayon Attendance Portal
                            </span>
                            <h1 className="text-lg font-bold leading-tight sm:text-xl">
                                {event.title}
                            </h1>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {events.length > 1 && (
                            <div className="w-52">
                                <Select2
                                    value={event.id}
                                    onChange={(val) => router.visit(`/events/${val}/attendance`)}
                                    options={eventOptions}
                                    placeholder="Switch event..."
                                    searchPlaceholder="Search event..."
                                />
                            </div>
                        )}
                        <Button
                            variant="outline"
                            size="sm"
                            asChild
                            className="text-xs gap-1.5 md:hidden"
                        >
                            <Link href="/menu" prefetch>
                                <LayoutGrid className="size-3.5 text-primary" />
                                <span>Menu</span>
                            </Link>
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.visit('/attendees')}
                            className="text-xs"
                        >
                            Admin Portal
                        </Button>
                    </div>
                </div>
            </header>

            <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
                {/* Success alert */}
                {status && registeredAttendee && (
                    <div className="mb-8 overflow-hidden rounded-2xl border border-emerald-200 bg-emerald-50/80 p-6 shadow-sm dark:border-emerald-900/50 dark:bg-emerald-950/30">
                        <div className="flex items-start gap-4">
                            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white">
                                <CheckCircle2 className="size-6" />
                            </div>
                            <div className="flex-1">
                                <span className="text-xs font-semibold tracking-wide text-emerald-800 uppercase dark:text-emerald-300">
                                    Registration Successful
                                </span>
                                <h3 className="mt-0.5 text-lg font-bold text-emerald-950 dark:text-emerald-100">
                                    Welcome, {registeredAttendee.prefix_name ? `${registeredAttendee.prefix_name} ` : ''}
                                    {registeredAttendee.fullname}!
                                </h3>
                                <div className="mt-2 flex flex-wrap gap-2">
                                    <Badge variant="secondary" className="bg-emerald-100 text-emerald-900 dark:bg-emerald-900/60 dark:text-emerald-200">
                                        {registeredAttendee.category?.name || 'Guest'}
                                    </Badge>
                                    {registeredAttendee.position && (
                                        <Badge variant="outline" className="border-emerald-300 text-emerald-800 dark:border-emerald-800 dark:text-emerald-300">
                                            {registeredAttendee.position}
                                        </Badge>
                                    )}
                                    {registeredAttendee.province && (
                                        <Badge variant="outline" className="border-emerald-300 text-emerald-800 dark:border-emerald-800 dark:text-emerald-300">
                                            {registeredAttendee.province.prov_name}
                                        </Badge>
                                    )}
                                    {registeredAttendee.city && (
                                        <Badge variant="outline" className="border-emerald-300 text-emerald-800 dark:border-emerald-800 dark:text-emerald-300">
                                            {registeredAttendee.city.city_name}
                                        </Badge>
                                    )}
                                    {!registeredAttendee.is_attending && registeredAttendee.rep_fullname && (
                                        <Badge variant="outline" className="border-amber-400 bg-amber-50 text-amber-900 dark:border-amber-700 dark:bg-amber-950/60 dark:text-amber-200">
                                            Rep: {registeredAttendee.rep_prefix_name ? `${registeredAttendee.rep_prefix_name} ` : ''}{registeredAttendee.rep_fullname}
                                            {registeredAttendee.rep_position ? ` (${registeredAttendee.rep_position})` : ''}
                                        </Badge>
                                    )}
                                </div>
                                <p className="mt-3 text-xs text-emerald-700 dark:text-emerald-400">
                                    Your attendance has been logged. You may take your seat; our event host will announce your presence shortly.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                <div className="grid gap-8 lg:grid-cols-3">
                    {/* Left Column: Category Selection */}
                    <div className="lg:col-span-1">
                        <Card className="shadow-md">
                            <CardHeader>
                                <div className="flex items-center gap-2 text-xs font-semibold text-primary uppercase">
                                    <Tag className="size-3.5" />
                                    <span>Step 1: Classification</span>
                                </div>
                                <CardTitle className="text-xl">Guest Category</CardTitle>
                                <CardDescription>
                                    Select your designated role or guest delegation type
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                {categories.map((cat) => {
                                    const isSelected = data.category_id === cat.id;
                                    return (
                                        <button
                                            key={cat.id}
                                            type="button"
                                            onClick={() => handleCategorySelect(cat)}
                                            className={`flex w-full items-center justify-between rounded-xl border p-3.5 text-left transition-all ${
                                                isSelected
                                                    ? 'border-primary bg-primary/5 shadow-xs ring-2 ring-primary/20 dark:bg-primary/10'
                                                    : 'border-neutral-200 bg-white hover:border-neutral-300 hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:bg-neutral-800/60'
                                            }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className={`flex size-8 items-center justify-center rounded-lg ${
                                                        isSelected
                                                            ? 'bg-primary text-primary-foreground'
                                                            : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400'
                                                    }`}
                                                >
                                                    <Users className="size-4" />
                                                </div>
                                                <div>
                                                    <div className="text-sm font-medium">{cat.name}</div>
                                                    <div className="text-xs text-neutral-500 capitalize">
                                                        {cat.scope === 'province'
                                                            ? 'Province Level'
                                                            : cat.scope === 'municipality'
                                                              ? 'Per Municipality / City'
                                                              : 'General'}
                                                    </div>
                                                </div>
                                            </div>
                                            <ChevronRight
                                                className={`size-4 transition-transform ${isSelected ? 'text-primary' : 'text-neutral-400'}`}
                                            />
                                        </button>
                                    );
                                })}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column: Attendance Registration Form */}
                    <div className="lg:col-span-2">
                        <Card className="shadow-md">
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-xs font-semibold text-primary uppercase">
                                        <UserCheck className="size-3.5" />
                                        <span>Step 2: Guest Details</span>
                                    </div>
                                    <Badge variant="outline" className="border-primary/40 bg-primary/10 text-primary">
                                        {selectedCategory?.name || 'Guest'}
                                    </Badge>
                                </div>
                                <CardTitle className="text-xl">Attendance Information</CardTitle>
                                <CardDescription>
                                    Simple registration with name, position, and jurisdiction
                                </CardDescription>
                            </CardHeader>

                            <CardContent>
                                <form onSubmit={handleSubmit} className="space-y-5">
                                    {/* Name: Prefix & Fullname */}
                                    <div className="grid gap-4 sm:grid-cols-12">
                                        <div className="sm:col-span-4">
                                            <Label htmlFor="reg_prefix_name" className="whitespace-nowrap">
                                                Prefix (Mr. Ms, Hon.)
                                            </Label>
                                            <Select2
                                                id="reg_prefix_name"
                                                value={data.prefix_name}
                                                onChange={(val) => setData('prefix_name', String(val))}
                                                options={prefixOptions}
                                                placeholder="Prefix..."
                                                searchPlaceholder="Search prefix..."
                                                className="mt-1.5"
                                                error={errors.prefix_name}
                                            />
                                            <InputError message={errors.prefix_name} />
                                        </div>

                                        <div className="sm:col-span-8">
                                            <Label htmlFor="reg_fullname">
                                                Full Name <span className="text-red-500">*</span>
                                            </Label>
                                            <Input
                                                id="reg_fullname"
                                                type="text"
                                                required
                                                value={data.fullname}
                                                onChange={(e) => setData('fullname', e.target.value)}
                                                placeholder="e.g. Juan P. Dela Cruz"
                                                className="mt-1.5"
                                            />
                                            <InputError message={errors.fullname} />
                                        </div>
                                    </div>

                                    {/* Position */}
                                    <div>
                                        <Label htmlFor="reg_position">
                                            Official Position / Designation <span className="text-red-500">*</span>
                                        </Label>
                                        <Input
                                            id="reg_position"
                                            type="text"
                                            value={data.position}
                                            onChange={(e) => {
                                                clearErrors('position');
                                                setData('position', e.target.value);
                                            }}
                                            placeholder={
                                                categoryInfo.isGov
                                                    ? 'Provincial Governor'
                                                    : categoryInfo.isMayor
                                                      ? 'Municipal Mayor'
                                                      : 'e.g. Regional Director, Branch Manager, etc. (Required)'
                                            }
                                            className="mt-1.5"
                                        />
                                        <InputError message={errors.position} />
                                    </div>

                                    {/* Confirmation to Attend Switch Section */}
                                    <div className="rounded-xl border border-neutral-200 bg-white p-3.5 sm:p-4 shadow-2xs dark:border-neutral-800 dark:bg-neutral-900/60 overflow-visible">
                                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                            <div className="space-y-0.5">
                                                <div className="flex items-center gap-2">
                                                    <Label htmlFor="reg_is_attending" className="text-xs font-bold text-neutral-800 dark:text-neutral-200 sm:text-sm">
                                                        Confirmation: Attending in Person?
                                                    </Label>
                                                    <Badge
                                                        variant="outline"
                                                        className={cn(
                                                            'text-[10px] font-semibold px-2 py-0.5',
                                                            data.is_attending
                                                                ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                                                                : 'border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300'
                                                        )}
                                                    >
                                                        {data.is_attending ? 'Yes — Confirmed to Attend' : 'No — Sending Representative'}
                                                    </Badge>
                                                </div>
                                                <p className="text-[11px] text-muted-foreground sm:text-xs">
                                                    {data.is_attending
                                                        ? 'The invited official/dignitary will personally attend the assembly.'
                                                        : 'The invited official is sending an authorized representative to attend on their behalf.'}
                                                </p>
                                            </div>

                                            <div className="flex items-center gap-2.5 self-start rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-1.5 dark:border-neutral-800 dark:bg-neutral-900 sm:self-center">
                                                <span className={cn('text-xs font-bold', !data.is_attending ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground')}>
                                                    NO
                                                </span>
                                                <Switch
                                                    id="reg_is_attending"
                                                    checked={data.is_attending}
                                                    onCheckedChange={(checked) => setData('is_attending', checked)}
                                                    aria-label="Attendance confirmation"
                                                />
                                                <span className={cn('text-xs font-bold', data.is_attending ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground')}>
                                                    YES
                                                </span>
                                            </div>
                                        </div>

                                        {/* If NO: Additional fields for Representative */}
                                        {!data.is_attending && (
                                            <div className="mt-3.5 border-t border-dashed border-amber-200 pt-3.5 dark:border-amber-900/60">
                                                <div className="mb-3 flex items-center justify-between">
                                                    <div className="flex items-center gap-2 text-xs font-bold text-amber-900 dark:text-amber-300">
                                                        <Users className="size-3.5 text-amber-600 dark:text-amber-400" />
                                                        <span>Authorized Representative Details</span>
                                                    </div>
                                                    <span className="text-[10px] text-amber-700 dark:text-amber-400 font-medium">
                                                        Representative attending on behalf of the invitee
                                                    </span>
                                                </div>

                                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-12">
                                                    {/* Representative Prefix */}
                                                    <div className="sm:col-span-3">
                                                        <Label htmlFor="reg_rep_prefix_name" className="text-xs font-semibold whitespace-nowrap">
                                                            Prefix (Mr. Ms, Hon.)
                                                        </Label>
                                                        <Select2
                                                            id="reg_rep_prefix_name"
                                                            value={data.rep_prefix_name}
                                                            onChange={(val) => setData('rep_prefix_name', String(val))}
                                                            options={repPrefixOptions}
                                                            placeholder="Prefix..."
                                                            searchPlaceholder="Prefix..."
                                                            className="mt-1"
                                                            error={errors.rep_prefix_name}
                                                        />
                                                        <InputError message={errors.rep_prefix_name} />
                                                    </div>

                                                    {/* Representative Full Name */}
                                                    <div className="sm:col-span-5">
                                                        <Label htmlFor="reg_rep_fullname" className="text-xs font-semibold">
                                                            Representative Name <span className="text-red-500">*</span>
                                                        </Label>
                                                        <Input
                                                            id="reg_rep_fullname"
                                                            type="text"
                                                            required={!data.is_attending}
                                                            value={data.rep_fullname}
                                                            onChange={(e) => setData('rep_fullname', e.target.value)}
                                                            placeholder="e.g. Maria Santos"
                                                            className="mt-1 h-9.5 rounded-lg border-neutral-300 bg-white text-xs sm:text-sm dark:border-neutral-700 dark:bg-neutral-900"
                                                        />
                                                        <InputError message={errors.rep_fullname} />
                                                    </div>

                                                    {/* Representative Position */}
                                                    <div className="sm:col-span-4">
                                                        <Label htmlFor="reg_rep_position" className="text-xs font-semibold">
                                                            Representative Position
                                                        </Label>
                                                        <Input
                                                            id="reg_rep_position"
                                                            type="text"
                                                            value={data.rep_position}
                                                            onChange={(e) => setData('rep_position', e.target.value)}
                                                            placeholder="e.g. Chief of Staff / Executive Assistant"
                                                            className="mt-1 h-9.5 rounded-lg border-neutral-300 bg-white text-xs sm:text-sm dark:border-neutral-700 dark:bg-neutral-900"
                                                        />
                                                        <InputError message={errors.rep_position} />
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Location Jurisdiction (Region 16 Province, City, Barangay) */}
                                    <div className="rounded-xl border border-neutral-200 bg-neutral-50/70 p-4 dark:border-neutral-800 dark:bg-neutral-900/40">
                                        <div className="mb-3 flex items-center justify-between">
                                            <div className="flex items-center gap-2 text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                                                <MapPin className="size-4 text-primary" />
                                                <span>Jurisdiction Details (Caraga Region 16)</span>
                                            </div>
                                            <span className="text-[10px] font-semibold text-primary">
                                                Region 16 (Caraga)
                                            </span>
                                        </div>

                                        {/* Province Select2 (Region 16 only, No Region dropdown) */}
                                        <div>
                                            <div className="flex items-center justify-between">
                                                <Label htmlFor="reg_province_id">
                                                    Province {categoryInfo.isProvinceRequired && <span className="text-red-500">*</span>}
                                                </Label>
                                                <span className="text-xs text-muted-foreground">
                                                    {region16Provinces.length} provinces in Region 16
                                                </span>
                                            </div>
                                            <Select2
                                                id="reg_province_id"
                                                value={data.province_id}
                                                onChange={(val) => {
                                                    clearErrors('province_id');
                                                    setData('province_id', val ? Number(val) : '');
                                                }}
                                                options={provinceOptions}
                                                placeholder={
                                                    categoryInfo.isProvinceRequired
                                                        ? 'Select Province in Region 16 (Required)...'
                                                        : 'Select Province in Region 16...'
                                                }
                                                searchPlaceholder="Search Region 16 province..."
                                                clearable={!categoryInfo.isProvinceRequired}
                                                className="mt-1.5"
                                                error={errors.province_id}
                                            />
                                            <InputError message={errors.province_id} />
                                        </div>

                                        <div className="mt-4 grid gap-4 sm:grid-cols-2">
                                            {/* City */}
                                            <div>
                                                <div className="flex items-center justify-between">
                                                    <Label htmlFor="reg_city_id">
                                                        City / Municipality {categoryInfo.isCityRequired && <span className="text-red-500">*</span>}
                                                    </Label>
                                                    {isLoadingCities && <Spinner className="size-3" />}
                                                </div>
                                                <Select2
                                                    id="reg_city_id"
                                                    value={categoryInfo.isGovOrPswdo ? '' : data.city_id}
                                                    onChange={(val) => {
                                                        clearErrors('city_id');
                                                        setData('city_id', val ? Number(val) : '');
                                                    }}
                                                    options={cityOptions}
                                                    disabled={categoryInfo.isGovOrPswdo || !data.province_id || isLoadingCities}
                                                    loading={isLoadingCities}
                                                    loadingText="Loading cities..."
                                                    placeholder={
                                                        categoryInfo.isGovOrPswdo
                                                            ? 'Not applicable for Province level'
                                                            : !data.province_id
                                                              ? 'Select province first'
                                                              : categoryInfo.isCityRequired
                                                                ? 'Select City / Municipality (Required)...'
                                                                : 'Select City / Municipality...'
                                                    }
                                                    searchPlaceholder="Search city / municipality..."
                                                    clearable={!categoryInfo.isGovOrPswdo && !categoryInfo.isCityRequired}
                                                    className="mt-1.5"
                                                    error={errors.city_id}
                                                />
                                                <InputError message={errors.city_id} />
                                            </div>

                                            {/* Barangay */}
                                            <div>
                                                <div className="flex items-center justify-between">
                                                    <Label htmlFor="reg_brgy_id">Barangay</Label>
                                                    {isLoadingBarangays && <Spinner className="size-3" />}
                                                </div>
                                                <Select2
                                                    id="reg_brgy_id"
                                                    value={categoryInfo.isGovOrPswdo ? '' : data.brgy_id}
                                                    onChange={(val) => setData('brgy_id', val ? Number(val) : '')}
                                                    options={barangayOptions}
                                                    disabled={categoryInfo.isGovOrPswdo || !data.city_id || isLoadingBarangays}
                                                    loading={isLoadingBarangays}
                                                    loadingText="Loading barangays..."
                                                    placeholder={
                                                        categoryInfo.isGovOrPswdo
                                                            ? 'Not applicable for Province level'
                                                            : !data.city_id
                                                              ? 'Select city first'
                                                              : 'Select Barangay...'
                                                    }
                                                    searchPlaceholder="Search barangay..."
                                                    clearable={!categoryInfo.isGovOrPswdo}
                                                    className="mt-1.5"
                                                    error={errors.brgy_id}
                                                />
                                                <InputError message={errors.brgy_id} />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-2">
                                        <Button
                                            type="submit"
                                            className="w-full gap-2 text-base font-semibold shadow-md"
                                            disabled={processing}
                                        >
                                            {processing && <Spinner />}
                                            <Save className="size-5" />
                                            <span>Save Guest Attendance</span>
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>
        </div>
    );
}
