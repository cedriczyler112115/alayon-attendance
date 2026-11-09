export type CategoryCustomFieldConfig = {
    id: number;
    label: string;
    placeholder: string;
};

export const CATEGORY_CUSTOM_FIELDS: Record<number, CategoryCustomFieldConfig> =
    {
        5: {
            id: 5,
            label: 'Agency',
            placeholder: 'e.g. DSWD, DILG, DepEd, DPWH, DA',
        },
        6: {
            id: 6,
            label: 'Branch Name',
            placeholder: 'e.g. Butuan Branch, Surigao Branch',
        },
        7: {
            id: 7,
            label: 'CSO Name',
            placeholder: 'e.g. Caraga Relief Foundation, Rotary Club',
        },
        8: {
            id: 8,
            label: 'Media Name',
            placeholder: 'e.g. ABS-CBN, GMA, Manila Bulletin, RMN DXBC',
        },
        9: {
            id: 9,
            label: 'School/Health Name',
            placeholder:
                'e.g. Agusan National High School / City Health Office',
        },
        12: {
            id: 12,
            label: 'Division Name',
            placeholder: 'e.g. Operations Division, Administrative Division',
        },
    };

export function getCategoryCustomField(
    category?: { id?: number | string; slug?: string; name?: string } | null,
): CategoryCustomFieldConfig | null {
    if (!category) return null;
    const catId = Number(category.id);
    if (CATEGORY_CUSTOM_FIELDS[catId]) {
        return CATEGORY_CUSTOM_FIELDS[catId];
    }
    const slug = category.slug?.toLowerCase() || '';
    if (slug === 'ngas') return CATEGORY_CUSTOM_FIELDS[5];
    if (slug === 'lbp-manager' || slug === 'lbp')
        return CATEGORY_CUSTOM_FIELDS[6];
    if (slug === 'csos' || slug === 'cso') return CATEGORY_CUSTOM_FIELDS[7];
    if (slug === 'media-partners' || slug === 'media')
        return CATEGORY_CUSTOM_FIELDS[8];
    if (slug === '4ps-coordinators' || slug === '4ps')
        return CATEGORY_CUSTOM_FIELDS[9];
    if (slug === 'rmancom') return CATEGORY_CUSTOM_FIELDS[12];
    return null;
}
