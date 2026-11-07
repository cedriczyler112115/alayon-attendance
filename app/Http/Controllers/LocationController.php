<?php

namespace App\Http\Controllers;

use App\Models\Barangay;
use App\Models\City;
use App\Models\Province;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LocationController extends Controller
{
    /**
     * Get all provinces, optionally filtered by region_code (defaults to Region 16 / Caraga).
     */
    public function provinces(Request $request): JsonResponse
    {
        $regionCode = $request->query('region_code', 16);

        $query = Province::query();

        if ($regionCode && $regionCode !== 'all') {
            $query->where('region_code', $regionCode);
        }

        $provinces = $query->orderBy('prov_name')
            ->get(['prov_code', 'prov_name', 'region_code']);

        return response()->json($provinces);
    }

    /**
     * Get cities, optionally filtered by province_id or region_code (defaults to Region 16).
     */
    public function cities(Request $request): JsonResponse
    {
        $provCode = $request->query('province_id');
        $regionCode = $request->query('region_code', 16);

        $query = City::with('province:prov_code,prov_name,region_code');

        if ($provCode) {
            $query->where('prov_code', $provCode);
        } elseif ($regionCode && $regionCode !== 'all') {
            $query->whereHas('province', fn ($q) => $q->where('region_code', $regionCode));
        }

        $cities = $query->orderBy('city_name')
            ->get(['city_code', 'city_name', 'prov_code']);

        return response()->json($cities);
    }

    /**
     * Get barangays by city code.
     */
    public function barangays(Request $request): JsonResponse
    {
        $cityCode = $request->query('city_id');

        $query = Barangay::query();

        if ($cityCode) {
            $query->where('city_code', $cityCode);
        }

        $barangays = $query->orderBy('brgy_name')
            ->get(['brgy_code', 'brgy_name', 'city_code']);

        return response()->json($barangays);
    }
}
