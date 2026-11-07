import { useForm } from '@inertiajs/react';
import { MapPin, Save, UserCheck, UserPlus, Users, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import InputError from '@/components/input-error';
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
import { Select2 } from '@/components/ui/select2';
import { Spinner } from '@/components/ui/spinner';
import { Switch } from '@/components/ui/switch';
import { getCategoryCustomField } from '@/lib/category-custom-fields';
import { cn } from '@/lib/utils';
import type { CityItem, EventItem, GuestCategory, ProvinceItem } from '@/types';

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    categories: GuestCategory[];
    provinces?: ProvinceItem[];
    cities?: CityItem[];
    events?: { id: number; title: string; status?: string }[];
    currentEvent?: EventItem | null;
};

const COMMON_PREFIXES = [
    'Hon.',
    'Mr.',
    'Ms.',
    'Gov.',
    'Mayor',
    'Vice Gov.',
    'Vice Mayor',
    'Dir.',
    'Sec.',
    'Asec.',
    'Atty.',
    'Engr.',
    'Dr.',
];

const REP_PREFIXES = [
    'Mr.',
    'Ms.',
    'Hon.',
    'Atty.',
    'Engr.',
    'Dr.',
];

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

export function RegisterGuestDialog({
    open,
    onOpenChange,
    categories = [],
    provinces: initialProvinces = [],
    cities: initialCities = [],
    events = [],
    currentEvent,
}: Props) {
    const initialEventId = currentEvent?.id || events[0]?.id || 1;

    const [provincesList, setProvincesList] = useState<ProvinceItem[]>(initialProvinces);
    const [allCities, setAllCities] = useState<CityItem[]>(initialCities);
    const [isLoadingCities, setIsLoadingCities] = useState(false);

    const { data, setData, post, processing, errors, reset, clearErrors, setError } = useForm({
        event_id: initialEventId,
        status: 'registered',
        is_attending: false,
        prefix_name: '',
        category_id: '' as unknown as number,
        fullname: '',
        position: '',
        agency_name: '',
        rep_prefix_name: 'Mr.',
        rep_fullname: '',
        rep_position: '',
        province_id: '' as string | number,
        city_id: '' as string | number,
        brgy_id: '' as string | number,
    });

    // Reset form when dialog opens
    useEffect(() => {
        if (open) {
            clearErrors();
            setData({
                event_id: currentEvent?.id || events[0]?.id || 1,
                status: 'registered',
                is_attending: false,
                prefix_name: '',
                category_id: '' as unknown as number,
                fullname: '',
                position: '',
                agency_name: '',
                rep_prefix_name: 'Mr.',
                rep_fullname: '',
                rep_position: '',
                province_id: '',
                city_id: '',
                brgy_id: '',
            });
        }
    }, [open]);

    // Ensure provinces for Region 16 are loaded if not passed
    useEffect(() => {
        if (provincesList.length === 0) {
            fetch('/api/locations/provinces?region_code=16')
                .then((res) => res.json())
                .then((d) => setProvincesList(d))
                .catch(() => {});
        }
    }, [provincesList.length]);

    // Ensure all cities for Region 16 are loaded if not passed
    useEffect(() => {
        if (allCities.length === 0) {
            setIsLoadingCities(true);
            fetch('/api/locations/cities?region_code=16')
                .then((res) => res.json())
                .then((d) => {
                    setAllCities(d);
                    setIsLoadingCities(false);
                })
                .catch(() => setIsLoadingCities(false));
        }
    }, [allCities.length]);

    // Filter to Region 16 (Caraga Region) provinces
    const region16Provinces = useMemo(() => {
        return provincesList.filter((p) => !p.region_code || Number(p.region_code) === 16);
    }, [provincesList]);

    const provinceMap = useMemo(() => {
        const map = new Map<number, string>();
        for (const p of provincesList) {
            map.set(p.prov_code, p.prov_name);
        }
        return map;
    }, [provincesList]);

    const duplicateCityNames = useMemo(() => {
        const counts = new Map<string, number>();
        for (const c of allCities) {
            const name = c.city_name.trim().toLowerCase();
            counts.set(name, (counts.get(name) || 0) + 1);
        }
        return counts;
    }, [allCities]);

    const displayedCities = useMemo(() => {
        if (!data.province_id) {
            return allCities;
        }
        return allCities.filter((c) => c.prov_code === Number(data.province_id));
    }, [allCities, data.province_id]);

    const selectedCityObj = useMemo(() => {
        if (!data.city_id) return null;
        return allCities.find((c) => c.city_code === Number(data.city_id)) || null;
    }, [allCities, data.city_id]);

    const isSelectedCityDuplicate = useMemo(() => {
        if (!selectedCityObj) return false;
        return (duplicateCityNames.get(selectedCityObj.city_name.trim().toLowerCase()) || 0) > 1;
    }, [selectedCityObj, duplicateCityNames]);

    const selectedCityProvinceName = useMemo(() => {
        if (!selectedCityObj) return '';
        return selectedCityObj.province?.prov_name || provinceMap.get(selectedCityObj.prov_code) || '';
    }, [selectedCityObj, provinceMap]);

    const handleCityChange = (cityCode: number | string) => {
        const code = cityCode ? Number(cityCode) : '';
        clearErrors('city_id');
        if (code) {
            clearErrors('province_id');
        }
        setData((prev) => {
            if (!code) {
                return { ...prev, city_id: '' };
            }
            const chosenCity = allCities.find((c) => c.city_code === code);
            const autoProvinceId = chosenCity ? chosenCity.prov_code : prev.province_id;
            return {
                ...prev,
                city_id: code,
                province_id: autoProvinceId,
            };
        });
    };

    const handleProvinceChange = (provCode: number | string) => {
        const code = provCode ? Number(provCode) : '';
        clearErrors('province_id');
        setData((prev) => {
            const currentCity = allCities.find((c) => c.city_code === Number(prev.city_id));
            const shouldClearCity = !code || (currentCity && currentCity.prov_code !== code);

            return {
                ...prev,
                province_id: code,
                city_id: shouldClearCity ? '' : prev.city_id,
            };
        });
    };

    const selectedCategory = categories.find((c) => c.id === Number(data.category_id));
    const categoryInfo = useMemo(() => getCategoryInfo(selectedCategory), [selectedCategory]);
    const customField = useMemo(() => getCategoryCustomField(selectedCategory), [selectedCategory]);

    const handleCategoryChange = (catId: number) => {
        clearErrors('province_id', 'city_id');
        const cat = categories.find((c) => c.id === catId);
        if (!cat) {
            setData((prev) => ({
                ...prev,
                category_id: '' as unknown as number,
                position: '',
                agency_name: '',
            }));
            return;
        }

        const info = getCategoryInfo(cat);
        const hasCustomField = !!getCategoryCustomField(cat);
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
                prefix_name = '';
            }
        }

        setData((prev) => ({
            ...prev,
            category_id: cat.id,
            prefix_name,
            position,
            agency_name: hasCustomField ? prev.agency_name : '',
            ...(info.isGovOrPswdo ? { city_id: '' } : {}),
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
                toast.success(`Guest attendance registered successfully: ${data.fullname}`);
                onOpenChange(false);
            },
        });
    };

    const eventOptions = useMemo(() => {
        return events.map((ev) => ({
            value: ev.id,
            label: ev.title,
            badge: ev.status ? ev.status.toUpperCase() : undefined,
        }));
    }, [events]);

    const categoryOptions = useMemo(() => {
        return categories.map((cat) => ({
            value: cat.id,
            label: cat.name,
            badge: cat.scope === 'province' ? 'Province Level' : cat.scope === 'municipality' ? 'Per City/Mun' : 'General',
        }));
    }, [categories]);

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
        return displayedCities.map((cty) => {
            const isDuplicate = (duplicateCityNames.get(cty.city_name.trim().toLowerCase()) || 0) > 1;
            const provName = cty.province?.prov_name || provinceMap.get(cty.prov_code) || '';

            return {
                value: cty.city_code,
                label: cty.city_name,
                badge: (isDuplicate || !data.province_id) && provName ? provName : undefined,
                description: provName ? `Province: ${provName}` : undefined,
            };
        });
    }, [displayedCities, duplicateCityNames, provinceMap, data.province_id]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className="w-[calc(100vw-1.5rem)] sm:w-full max-w-2xl sm:max-w-3xl max-h-[90vh] overflow-y-auto overflow-x-hidden p-3.5 sm:p-6"
                onPointerDownOutside={(e) => e.preventDefault()}
                onInteractOutside={(e) => e.preventDefault()}
                hideCloseButton={true}
            >
                <DialogHeader className="pb-3 border-b border-neutral-100 dark:border-neutral-800">
                    <div className="flex items-start justify-between gap-2.5 sm:gap-3">
                        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                            <div className="flex size-9 sm:size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20 dark:bg-primary/20 dark:border-primary/30 shadow-2xs">
                                <UserPlus className="size-4.5 sm:size-5" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                                    <DialogTitle className="text-sm sm:text-base md:text-lg font-bold tracking-tight text-neutral-900 dark:text-white">
                                        Register Guest Attendance
                                    </DialogTitle>
                                    <Badge variant="outline" className="border-primary/30 text-primary text-[10px] font-semibold shrink-0">
                                        Region 16
                                    </Badge>
                                    {currentEvent && (
                                        <Badge variant="secondary" className="hidden md:inline-flex text-[10px] font-medium text-muted-foreground">
                                            Event: <strong className="ml-1 font-semibold text-neutral-800 dark:text-neutral-200">{currentEvent.title}</strong>
                                        </Badge>
                                    )}
                                </div>
                                <DialogDescription className="text-xs text-muted-foreground mt-0.5 truncate">
                                    Register arriving guest or official
                                </DialogDescription>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={() => onOpenChange(false)}
                            className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-neutral-200/60 bg-neutral-50/50 text-neutral-400 hover:border-neutral-300 hover:bg-neutral-100 hover:text-neutral-800 dark:border-neutral-800 dark:bg-neutral-900/50 dark:text-neutral-400 dark:hover:border-neutral-700 dark:hover:bg-neutral-800 dark:hover:text-white transition-all shadow-2xs"
                            title="Close modal (Esc)"
                            aria-label="Close modal"
                        >
                            <X className="size-4" />
                        </button>
                    </div>
                </DialogHeader>

                <form id="register_guest_form" onSubmit={handleSubmit} className="space-y-4 pt-2">
                    {/* Event Selector (if multiple events exist) */}
                    {events.length > 1 && (
                        <div>
                            <Label htmlFor="dlg_event_id" className="text-xs font-semibold">
                                Target Event <span className="text-red-500">*</span>
                            </Label>
                            <Select2
                                id="dlg_event_id"
                                value={data.event_id}
                                onChange={(val) => setData('event_id', Number(val))}
                                options={eventOptions}
                                placeholder="Select event..."
                                className="mt-1"
                                error={errors.event_id}
                            />
                            <InputError message={errors.event_id} />
                        </div>
                    )}

                    {/* Primary Guest Details Row */}
                    <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-12">
                        {/* Category */}
                        <div className="col-span-1 sm:col-span-1 lg:col-span-4">
                            <Label htmlFor="dlg_category_id" className="text-xs font-semibold">
                                Category <span className="text-red-500">*</span>
                            </Label>
                            <Select2
                                id="dlg_category_id"
                                value={data.category_id}
                                onChange={(val) => handleCategoryChange(Number(val))}
                                options={categoryOptions}
                                placeholder="Select category..."
                                searchPlaceholder="Search category..."
                                className="mt-1"
                                error={errors.category_id}
                            />
                            <InputError message={errors.category_id} />
                        </div>

                        {/* Prefix */}
                        <div className="col-span-1 sm:col-span-1 lg:col-span-3">
                            <Label htmlFor="dlg_prefix_name" className="text-xs font-semibold whitespace-nowrap">
                                Prefix (Mr. Ms, Hon.)
                            </Label>
                            <Select2
                                id="dlg_prefix_name"
                                value={data.prefix_name}
                                onChange={(val) => setData('prefix_name', String(val))}
                                options={prefixOptions}
                                placeholder="Prefix..."
                                searchPlaceholder="Search prefix..."
                                className="mt-1"
                                error={errors.prefix_name}
                            />
                            <InputError message={errors.prefix_name} />
                        </div>

                        {/* Full Name */}
                        <div className="col-span-1 sm:col-span-2 lg:col-span-5">
                            <Label htmlFor="dlg_fullname" className="text-xs font-semibold">
                                Full Name <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="dlg_fullname"
                                type="text"
                                required
                                value={data.fullname}
                                onChange={(e) => setData('fullname', e.target.value)}
                                placeholder="e.g. Juan P. Dela Cruz"
                                className="mt-1 h-9.5 rounded-lg border-neutral-300 dark:border-neutral-700 text-xs sm:text-sm"
                            />
                            <InputError message={errors.fullname} />
                        </div>

                        {/* Official Position (Row 2 on desktop, beside Custom Field & Status) */}
                        <div className={cn('col-span-1 sm:col-span-1', customField ? 'lg:col-span-5' : 'lg:col-span-8')}>
                            <Label htmlFor="dlg_position" className="text-xs font-semibold">
                                Official Position / Designation <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="dlg_position"
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
                                          : 'Official position / designation (Required)'
                                }
                                className="mt-1 h-9.5 rounded-lg border-neutral-300 dark:border-neutral-700 text-xs sm:text-sm"
                            />
                            <InputError message={errors.position} />
                        </div>

                        {/* Additional Category-Specific Field (Agency / Branch Name / CSO Name / School/Health Name / Division Name) */}
                        {customField && (
                            <div className="col-span-1 sm:col-span-1 lg:col-span-4">
                                <Label htmlFor="dlg_agency_name" className="text-xs font-semibold whitespace-nowrap">
                                    {customField.label}
                                </Label>
                                <Input
                                    id="dlg_agency_name"
                                    type="text"
                                    value={data.agency_name}
                                    onChange={(e) => setData('agency_name', e.target.value)}
                                    placeholder={customField.placeholder}
                                    className="mt-1 h-9.5 rounded-lg border-neutral-300 dark:border-neutral-700 text-xs sm:text-sm"
                                />
                                <InputError message={errors.agency_name} />
                            </div>
                        )}

                        {/* Status (Row 2 on desktop, beside Official Position & Custom Field) */}
                        <div className={cn('col-span-1 sm:col-span-1', customField ? 'lg:col-span-3' : 'lg:col-span-4')}>
                            <Label htmlFor="dlg_status" className="text-xs font-semibold">
                                Status
                            </Label>
                            <Select2
                                id="dlg_status"
                                value={data.status}
                                onChange={(val) => setData('status', String(val))}
                                options={[
                                    { value: 'registered', label: 'Registered' },
                                    { value: 'called', label: 'Called' },
                                ]}
                                placeholder="Select status..."
                                className="mt-1"
                                error={errors.status}
                            />
                            <InputError message={errors.status} />
                        </div>
                    </div>

                    {/* Confirmation to Attend Switch Section */}
                    <div className="rounded-xl border border-neutral-200 bg-neutral-50/50 p-3.5 sm:p-4 shadow-2xs dark:border-neutral-800 dark:bg-neutral-900/60 overflow-visible">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="space-y-0.5">
                                <div className="flex items-center gap-2">
                                    <Label htmlFor="dlg_is_attending" className="text-xs font-bold text-neutral-800 dark:text-neutral-200 sm:text-sm">
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

                            <div className="flex items-center gap-2.5 self-start rounded-lg border border-neutral-200 bg-white px-3 py-1.5 dark:border-neutral-700 dark:bg-neutral-800 sm:self-center">
                                <span className={cn('text-xs font-bold', !data.is_attending ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground')}>
                                    NO
                                </span>
                                <Switch
                                    id="dlg_is_attending"
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
                                        Please provide the representative attending on behalf of the invitee
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-12">
                                    {/* Representative Prefix */}
                                    <div className="sm:col-span-3">
                                        <Label htmlFor="dlg_rep_prefix_name" className="text-xs font-semibold whitespace-nowrap">
                                            Prefix (Mr. Ms, Hon.)
                                        </Label>
                                        <Select2
                                            id="dlg_rep_prefix_name"
                                            value={data.rep_prefix_name}
                                            onChange={(val) => setData('rep_prefix_name', String(val))}
                                            options={repPrefixOptions}
                                            placeholder="Prefix..."
                                            className="mt-1"
                                            error={errors.rep_prefix_name}
                                        />
                                        <InputError message={errors.rep_prefix_name} />
                                    </div>

                                    {/* Representative Full Name */}
                                    <div className="sm:col-span-5">
                                        <Label htmlFor="dlg_rep_fullname" className="text-xs font-semibold">
                                            Representative Name <span className="text-red-500">*</span>
                                        </Label>
                                        <Input
                                            id="dlg_rep_fullname"
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
                                        <Label htmlFor="dlg_rep_position" className="text-xs font-semibold">
                                            Representative Position
                                        </Label>
                                        <Input
                                            id="dlg_rep_position"
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

                    {/* Location Jurisdiction Box */}
                    <div className="rounded-xl border border-neutral-200 bg-neutral-50/70 p-3.5 sm:p-4 dark:border-neutral-800 dark:bg-neutral-900/40 overflow-visible">
                        <div className="mb-3 flex items-center justify-between">
                            <div className="flex items-center gap-2 text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                                <MapPin className="size-3.5 text-primary" />
                                <span>Jurisdiction (Region 16 Caraga)</span>
                            </div>
                            <span className="text-[10px] font-semibold text-primary">
                                {categoryInfo.isGovOrPswdo
                                    ? 'Province Level Jurisdiction (Province Required, City Disabled)'
                                    : categoryInfo.isMayorOrCswdo
                                      ? 'Province & Municipality Required'
                                      : 'Select Municipality or Province'}
                            </span>
                        </div>

                        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                            {/* Province Select2 */}
                            <div>
                                <Label htmlFor="dlg_province_id" className="text-xs font-semibold">
                                    Province {categoryInfo.isProvinceRequired && <span className="text-red-500">*</span>}
                                </Label>
                                <Select2
                                    id="dlg_province_id"
                                    value={data.province_id}
                                    onChange={handleProvinceChange}
                                    options={provinceOptions}
                                    placeholder={
                                        categoryInfo.isProvinceRequired
                                            ? 'Select Province (Required)...'
                                            : 'Select Province...'
                                    }
                                    searchPlaceholder="Search Region 16 province..."
                                    clearable={!categoryInfo.isProvinceRequired}
                                    className="mt-1"
                                    error={errors.province_id}
                                />
                                <InputError message={errors.province_id} />
                            </div>

                            {/* City / Municipality Select2 */}
                            <div>
                                <div className="flex items-center justify-between">
                                    <Label
                                        htmlFor="dlg_city_id"
                                        className={cn(
                                            'text-xs font-semibold',
                                            categoryInfo.isGovOrPswdo && 'text-muted-foreground'
                                        )}
                                    >
                                        City / Municipality {categoryInfo.isCityRequired && <span className="text-red-500">*</span>}
                                    </Label>
                                    {categoryInfo.isGovOrPswdo ? (
                                        <Badge
                                            variant="outline"
                                            className="text-[10px] border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400 font-medium"
                                        >
                                            Disabled ({categoryInfo.isGov ? 'Governor' : 'PSWDO'} - Province level)
                                        </Badge>
                                    ) : isSelectedCityDuplicate && selectedCityProvinceName ? (
                                        <Badge
                                            variant="outline"
                                            className="text-[10px] border-primary/40 bg-primary/5 text-primary font-medium"
                                        >
                                            {selectedCityProvinceName}
                                        </Badge>
                                    ) : null}
                                </div>
                                <Select2
                                    id="dlg_city_id"
                                    value={categoryInfo.isGovOrPswdo ? '' : data.city_id}
                                    onChange={handleCityChange}
                                    options={cityOptions}
                                    disabled={categoryInfo.isGovOrPswdo}
                                    loading={!categoryInfo.isGovOrPswdo && isLoadingCities}
                                    loadingText="Loading municipalities..."
                                    placeholder={
                                        categoryInfo.isGovOrPswdo
                                            ? 'Not applicable (Province level)'
                                            : categoryInfo.isCityRequired
                                              ? 'Select municipality (Required)...'
                                              : data.province_id
                                                ? 'Select municipality in province...'
                                                : 'Select City / Municipality (All)...'
                                    }
                                    clearable={!categoryInfo.isGovOrPswdo && !categoryInfo.isCityRequired}
                                    className="mt-1"
                                    error={errors.city_id}
                                />
                                <InputError message={errors.city_id} />
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="pt-2 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => onOpenChange(false)}
                            disabled={processing}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            size="sm"
                            disabled={processing}
                            className="gap-1.5 font-semibold shadow-xs"
                        >
                            {processing && <Spinner className="size-3.5" />}
                            <UserCheck className="size-3.5" />
                            <span>Tagged as Attended</span>
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

