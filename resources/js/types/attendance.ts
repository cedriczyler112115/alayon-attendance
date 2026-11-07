export type EventItem = {
    id: number;
    title: string;
    theme?: string | null;
    venue?: string | null;
    event_date: string;
    status: 'active' | 'completed' | 'archived';
    created_at?: string;
    updated_at?: string;
    attendees_count?: number;
    announced_count?: number;
};

export type GuestCategory = {
    id: number;
    name: string;
    slug: string;
    scope: 'province' | 'municipality' | 'general';
    description?: string | null;
    order: number;
    is_active: boolean;
    allow_call?: boolean;
    created_at?: string;
    updated_at?: string;
    attendees_count?: number;
};

export type ProvinceItem = {
    prov_code: number;
    prov_name: string;
    psgc_prv?: string | null;
    region_code?: number | null;
};

export type CityItem = {
    city_code: number;
    city_name: string;
    prov_code: number;
    province?: {
        prov_code: number;
        prov_name: string;
        region_code?: number;
    } | null;
};

export type BarangayItem = {
    brgy_code: number;
    brgy_name: string;
    city_code: number;
};

export type Attendee = {
    id: number;
    event_id?: number | null;
    status: 'registered' | 'called' | 'invited';
    is_attending?: boolean;
    prefix_name?: string | null;
    category_id: number;
    fullname: string;
    position?: string | null;
    agency_name?: string | null;
    office_agency?: string | null;
    rep_prefix_name?: string | null;
    rep_fullname?: string | null;
    rep_position?: string | null;
    province_id?: number | null;
    city_id?: number | null;
    brgy_id?: number | null;
    created_by?: number | null;
    created_at?: string;
    updated_at?: string;

    // Appended and relation properties
    name?: string;
    rep_name?: string | null;
    designation?: string | null;
    is_announced?: boolean;
    event?: EventItem | null;
    category?: GuestCategory;
    province?: ProvinceItem | null;
    city?: CityItem | null;
    barangay?: BarangayItem | null;
    creator?: { id: number; name: string; email?: string } | null;
};
