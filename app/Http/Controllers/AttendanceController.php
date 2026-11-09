<?php

namespace App\Http\Controllers;

use App\Models\Attendee;
use App\Models\City;
use App\Models\Event;
use App\Models\GuestCategory;
use App\Models\Province;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AttendanceController extends Controller
{
    /**
     * Display the public attendance registration page.
     */
    public function create(Request $request, ?Event $event = null): Response
    {
        $event = $event ?? Event::where('status', 'active')->latest()->first() ?? Event::firstOrCreate(
            ['title' => 'Alayon Annual Stakeholders & LGU Leaders Assembly'],
            [
                'theme' => 'Alayon connect: powering progress',
                'venue' => 'Grand Convention Center, Provincial Capitol Complex',
                'event_date' => now()->toDateString(),
                'status' => 'active',
            ]
        );

        $categories = GuestCategory::where('is_active', true)
            ->orderBy('order')
            ->get();

        $activeEvents = Event::where('status', 'active')
            ->orderBy('event_date', 'desc')
            ->get(['id', 'title', 'event_date', 'venue']);

        $provinces = Province::where('region_code', 16)
            ->orderBy('prov_name')
            ->get(['prov_code', 'prov_name', 'region_code']);

        $cities = City::whereHas('province', fn ($q) => $q->where('region_code', 16))
            ->with('province:prov_code,prov_name,region_code')
            ->orderBy('city_name')
            ->get(['city_code', 'city_name', 'prov_code']);

        $cities = City::whereHas('province', fn ($q) => $q->where('region_code', 16))
            ->with('province:prov_code,prov_name,region_code')
            ->orderBy('city_name')
            ->get(['city_code', 'city_name', 'prov_code']);

        return Inertia::render('attendance/register', [
            'event' => $event,
            'categories' => $categories,
            'events' => $activeEvents,
            'provinces' => $provinces,
            'cities' => $cities,
            'status' => $request->session()->get('status'),
            'registeredAttendee' => $request->session()->get('registeredAttendee'),
        ]);
    }

    /**
     * Determine category jurisdiction rules.
     *
     * @return array{isGovOrPswdo: bool, isProvinceRequired: bool, isCityRequired: bool}
     */
    private function resolveCategoryJurisdictionRules(?int $categoryId): array
    {
        if (! $categoryId) {
            return ['isGovOrPswdo' => false, 'isProvinceRequired' => false, 'isCityRequired' => false];
        }

        $category = GuestCategory::find($categoryId);
        if (! $category) {
            return ['isGovOrPswdo' => false, 'isProvinceRequired' => false, 'isCityRequired' => false];
        }

        $catSlug = strtolower($category->slug ?? '');
        $catName = strtolower($category->name ?? '');

        $isGov = $catSlug === 'governors' || $catSlug === 'governor' || str_contains($catName, 'governor');
        $isMayor = $catSlug === 'mayors' || $catSlug === 'mayor' || str_contains($catName, 'mayor');
        $isPswdo = $catSlug === 'pswdo' || str_contains($catName, 'pswdo');
        $isCswdo = $catSlug === 'cswdo' || str_contains($catName, 'cswdo');
        $isLguLink = $catSlug === 'lgu-links' || $catSlug === 'lgu_links' || str_contains($catName, 'lgu link');

        $isGovOrPswdo = $isGov || $isPswdo;
        $isCityRequired = $isMayor || $isCswdo || $isLguLink;
        $isProvinceRequired = $isGovOrPswdo || $isCityRequired;

        return [
            'isGovOrPswdo' => $isGovOrPswdo,
            'isProvinceRequired' => $isProvinceRequired,
            'isCityRequired' => $isCityRequired,
        ];
    }

    /**
     * Store a new attendance registration.
     */
    public function store(Request $request): RedirectResponse
    {
        if ($request->user() && $request->user()->isHost()) {
            abort(403, 'Access denied. Host role is not authorized to register attendees.');
        }

        $catRules = $this->resolveCategoryJurisdictionRules($request->integer('category_id'));
        $isGovOrPswdo = $catRules['isGovOrPswdo'];

        $provinceRule = $catRules['isProvinceRequired']
            ? ['required', 'integer']
            : ['nullable', 'integer'];

        $cityRule = $catRules['isCityRequired']
            ? ['required', 'integer']
            : ['nullable', 'integer'];

        $validated = $request->validate([
            'event_id' => ['nullable', 'exists:events,id'],
            'status' => ['nullable', 'string', 'in:registered,called,invited'],
            'is_attending' => ['nullable', 'boolean'],
            'prefix_name' => ['nullable', 'string', 'max:50'],
            'category_id' => ['required', 'exists:guest_categories,id'],
            'fullname' => ['required', 'string', 'max:255'],
            'position' => ['required', 'string', 'max:255'],
            'agency_name' => ['nullable', 'string', 'max:255'],
            'office_agency' => ['nullable', 'string', 'max:255'],
            'rep_prefix_name' => ['nullable', 'string', 'max:50'],
            'rep_fullname' => ['nullable', 'string', 'max:255'],
            'rep_position' => ['nullable', 'string', 'max:255'],
            'province_id' => $provinceRule,
            'city_id' => $cityRule,
            'brgy_id' => ['nullable', 'integer'],
        ], [
            'position.required' => 'The official position / designation field is required.',
            'province_id.required' => 'The province field is required.',
            'city_id.required' => 'The city/municipality field is required.',
        ]);

        $isAttending = $request->boolean('is_attending', false);
        $agencyName = $validated['agency_name'] ?? $validated['office_agency'] ?? null;
        $status = $validated['status'] ?? 'invited';
        $registeredAt = ($status === 'registered' || $status === 'called') ? now() : null;

        $attendee = Attendee::create([
            ...$validated,
            'agency_name' => $agencyName,
            'status' => $status,
            'registered_at' => $registeredAt,
            'is_attending' => $isAttending,
            'rep_prefix_name' => ! $isAttending ? ($validated['rep_prefix_name'] ?? null) : null,
            'rep_fullname' => ! $isAttending ? ($validated['rep_fullname'] ?? null) : null,
            'rep_position' => ! $isAttending ? ($validated['rep_position'] ?? null) : null,
            'city_id' => $isGovOrPswdo ? null : ($validated['city_id'] ?? null),
            'brgy_id' => $isGovOrPswdo ? null : ($validated['brgy_id'] ?? null),
            'created_by' => $request->user()?->id,
            'created_at' => now(),
        ]);

        $attendee->load(['category', 'province', 'city', 'barangay']);

        return back()->with([
            'status' => 'Attendance successfully registered!',
            'registeredAttendee' => $attendee,
        ]);
    }

    /**
     * Display a listing of all attendees for an event (administrative/dashboard view).
     */
    public function index(Request $request): Response
    {
        $eventId = $request->input('event_id');
        $event = $eventId ? Event::find($eventId) : Event::where('status', 'active')->latest()->first();

        $events = Event::orderBy('event_date', 'desc')->get(['id', 'title', 'status', 'event_date']);
        $categories = GuestCategory::where('is_active', true)->orderBy('order')->get();
        $provinces = Province::where('region_code', 16)
            ->orderBy('prov_name')
            ->get(['prov_code', 'prov_name', 'region_code']);

        $cities = City::whereHas('province', fn ($q) => $q->where('region_code', 16))
            ->with('province:prov_code,prov_name,region_code')
            ->orderBy('city_name')
            ->get(['city_code', 'city_name', 'prov_code']);

        $catInput = $request->input('category_ids') ?? $request->input('category_id');
        $categoryIds = is_array($catInput)
            ? array_filter($catInput)
            : (is_string($catInput) && $catInput !== '' && $catInput !== 'all'
                ? array_filter(explode(',', $catInput))
                : []);

        $query = Attendee::with(['event', 'category', 'province', 'city', 'barangay', 'creator'])
            ->when($event, fn ($q) => $q->where('event_id', $event->id))
            ->when(! empty($categoryIds), fn ($q) => $q->whereIn('category_id', $categoryIds))
            ->when(in_array($request->input('status'), ['called', 'registered', 'invited'], true), function ($q) use ($request) {
                $q->where('status', $request->input('status'));
            })
            ->when($request->input('attendance_mode') === 'without_rep' || $request->input('attendance_mode') === 'in_person', function ($q) {
                $q->where('is_attending', true)->whereNull('rep_fullname');
            })
            ->when($request->input('attendance_mode') === 'with_rep' || $request->input('attendance_mode') === 'represented', function ($q) {
                $q->where(fn ($sq) => $sq->where('is_attending', false)->orWhereNotNull('rep_fullname'));
            })
            ->when($request->input('province_id'), fn ($q, $prov) => $q->where('province_id', $prov))
            ->when($request->input('city_id'), fn ($q, $city) => $q->where('city_id', $city))
            ->when($request->input('search'), function ($q, $search) {
                $q->where(function ($sq) use ($search) {
                    $sq->where('fullname', 'like', "%{$search}%")
                        ->orWhere('position', 'like', "%{$search}%")
                        ->orWhere('agency_name', 'like', "%{$search}%")
                        ->orWhere('rep_fullname', 'like', "%{$search}%")
                        ->orWhere('rep_position', 'like', "%{$search}%")
                        ->orWhereHas('province', fn ($pq) => $pq->where('prov_name', 'like', "%{$search}%"))
                        ->orWhereHas('city', fn ($cq) => $cq->where('city_name', 'like', "%{$search}%"))
                        ->orWhereHas('barangay', fn ($bq) => $bq->where('brgy_name', 'like', "%{$search}%"));
                });
            });

        $perPageInput = $request->input('per_page', '20');
        if ($perPageInput === 'all') {
            $totalCount = (clone $query)->count();
            $perPage = max($totalCount, 1);
        } else {
            $perPage = in_array((int) $perPageInput, [10, 20, 25, 50, 100], true) ? (int) $perPageInput : 20;
        }

        $attendees = $query->latest('created_at')->paginate($perPage)->withQueryString();

        return Inertia::render('attendance/index', [
            'currentEvent' => $event,
            'events' => $events,
            'categories' => $categories,
            'provinces' => $provinces,
            'cities' => $cities,
            'attendees' => $attendees,
            'filters' => $request->only(['event_id', 'category_id', 'category_ids', 'status', 'search', 'province_id', 'city_id', 'per_page', 'attendance_mode']),
        ]);
    }

    /**
     * Fetch filtered attendee dataset and summaries specifically formatted for printing and print preview.
     */
    public function printData(Request $request): JsonResponse
    {
        $eventId = $request->input('event_id');
        $event = null;
        if ($eventId && $eventId !== 'all') {
            $event = Event::find($eventId);
        } elseif (! $request->has('event_id') || $request->input('event_id') === '') {
            $event = Event::where('status', 'active')->latest()->first();
        }

        $catInput = $request->input('category_ids') ?? $request->input('category_id');
        $categoryIds = is_array($catInput)
            ? array_filter($catInput)
            : (is_string($catInput) && $catInput !== '' && $catInput !== 'all'
                ? array_filter(explode(',', $catInput))
                : []);

        $statusFilter = $request->input('status', 'registered');

        $query = Attendee::with(['event', 'category', 'province', 'city', 'barangay', 'creator'])
            ->when($event, fn ($q) => $q->where('event_id', $event->id))
            ->when(! empty($categoryIds), fn ($q) => $q->whereIn('category_id', $categoryIds))
            ->when($statusFilter && $statusFilter !== 'all', fn ($q) => $q->where('status', $statusFilter))
            ->when($request->input('attendance_mode') === 'without_rep' || $request->input('attendance_mode') === 'in_person', function ($q) {
                $q->where('is_attending', true)->whereNull('rep_fullname');
            })
            ->when($request->input('attendance_mode') === 'with_rep' || $request->input('attendance_mode') === 'represented', function ($q) {
                $q->where(fn ($sq) => $sq->where('is_attending', false)->orWhereNotNull('rep_fullname'));
            })
            ->when($request->filled('province_id') && $request->input('province_id') !== 'all', fn ($q) => $q->where('province_id', $request->input('province_id')))
            ->when($request->filled('city_id') && $request->input('city_id') !== 'all', fn ($q) => $q->where('city_id', $request->input('city_id')))
            ->when($request->filled('search'), function ($q) use ($request) {
                $search = $request->input('search');
                $q->where(function ($sq) use ($search) {
                    $sq->where('fullname', 'like', "%{$search}%")
                        ->orWhere('position', 'like', "%{$search}%")
                        ->orWhere('agency_name', 'like', "%{$search}%")
                        ->orWhere('rep_fullname', 'like', "%{$search}%")
                        ->orWhere('rep_position', 'like', "%{$search}%")
                        ->orWhereHas('province', fn ($pq) => $pq->where('prov_name', 'like', "%{$search}%"))
                        ->orWhereHas('city', fn ($cq) => $cq->where('city_name', 'like', "%{$search}%"))
                        ->orWhereHas('barangay', fn ($bq) => $bq->where('brgy_name', 'like', "%{$search}%"));
                });
            });

        $sortBy = $request->input('sort_by', 'protocol');
        if ($sortBy === 'name_asc') {
            $query->orderBy('fullname', 'asc');
        } elseif ($sortBy === 'name_desc') {
            $query->orderBy('fullname', 'desc');
        } elseif ($sortBy === 'time_asc') {
            $query->orderByRaw('COALESCE(registered_at, created_at) asc');
        } elseif ($sortBy === 'time_desc') {
            $query->orderByRaw('COALESCE(registered_at, created_at) desc');
        } elseif ($sortBy === 'lgu') {
            $query->leftJoin('lib_provinces', 'attendees.province_id', '=', 'lib_provinces.prov_code')
                ->leftJoin('lib_cities', 'attendees.city_id', '=', 'lib_cities.city_code')
                ->select('attendees.*')
                ->orderBy('lib_provinces.prov_name', 'asc')
                ->orderBy('lib_cities.city_name', 'asc')
                ->orderBy('attendees.fullname', 'asc');
        } elseif ($sortBy === 'protocol') {
            $query->leftJoin('guest_categories', 'attendees.category_id', '=', 'guest_categories.id')
                ->select('attendees.*')
                ->orderBy('guest_categories.order', 'asc')
                ->orderBy('attendees.created_at', 'asc');
        } else {
            $query->latest('created_at');
        }

        $attendees = $query->get();

        return response()->json([
            'event' => $event,
            'attendees' => $attendees,
            'summary' => [
                'total' => $attendees->count(),
                'in_person' => $attendees->where('is_attending', true)->whereNull('rep_fullname')->count(),
                'represented' => $attendees->filter(fn ($a) => ! $a->is_attending || ! empty($a->rep_fullname))->count(),
                'called' => $attendees->where('status', 'called')->count(),
                'registered' => $attendees->where('status', 'registered')->count(),
                'invited' => $attendees->where('status', 'invited')->count(),
            ],
        ]);
    }

    /**
     * Update an attendee's details.
     */
    public function update(Request $request, Attendee $attendee): RedirectResponse
    {
        if ($attendee->status === 'called') {
            return back()->with('error', 'Cannot update an attendee whose status is called.');
        }

        $catRules = $this->resolveCategoryJurisdictionRules(
            $request->filled('category_id') ? $request->integer('category_id') : (int) $attendee->category_id
        );
        $isGovOrPswdo = $catRules['isGovOrPswdo'];

        $provinceRule = $catRules['isProvinceRequired']
            ? ['required', 'integer']
            : ['nullable', 'integer'];

        $cityRule = $catRules['isCityRequired']
            ? ['required', 'integer']
            : ['nullable', 'integer'];

        $validated = $request->validate([
            'event_id' => ['nullable', 'exists:events,id'],
            'status' => ['nullable', 'string', 'in:registered,called,invited'],
            'is_attending' => ['nullable', 'boolean'],
            'prefix_name' => ['nullable', 'string', 'max:50'],
            'category_id' => ['required', 'exists:guest_categories,id'],
            'fullname' => ['required', 'string', 'max:255'],
            'position' => ['required', 'string', 'max:255'],
            'agency_name' => ['nullable', 'string', 'max:255'],
            'office_agency' => ['nullable', 'string', 'max:255'],
            'rep_prefix_name' => ['nullable', 'string', 'max:50'],
            'rep_fullname' => ['nullable', 'string', 'max:255'],
            'rep_position' => ['nullable', 'string', 'max:255'],
            'province_id' => $provinceRule,
            'city_id' => $cityRule,
            'brgy_id' => ['nullable', 'integer'],
        ], [
            'position.required' => 'The official position / designation field is required.',
            'province_id.required' => 'The province field is required.',
            'city_id.required' => 'The city/municipality field is required.',
        ]);

        $isAttending = $request->has('is_attending') ? $request->boolean('is_attending') : $attendee->is_attending;
        $agencyName = array_key_exists('agency_name', $validated)
            ? $validated['agency_name']
            : (array_key_exists('office_agency', $validated) ? $validated['office_agency'] : $attendee->agency_name);

        $newStatus = $validated['status'] ?? $attendee->status;
        $registeredAt = $attendee->registered_at;

        // When toggling from invited to registered, or registering for the first time, log the date registered
        if (($newStatus === 'registered' || $newStatus === 'called') && ($attendee->status === 'invited' || empty($registeredAt))) {
            $registeredAt = now();
        } elseif ($newStatus === 'invited') {
            $registeredAt = null;
        }

        $attendee->update([
            ...$validated,
            'agency_name' => $agencyName,
            'status' => $newStatus,
            'registered_at' => $registeredAt,
            'is_attending' => $isAttending,
            'rep_prefix_name' => ! $isAttending ? ($validated['rep_prefix_name'] ?? null) : null,
            'rep_fullname' => ! $isAttending ? ($validated['rep_fullname'] ?? null) : null,
            'rep_position' => ! $isAttending ? ($validated['rep_position'] ?? null) : null,
            'city_id' => $isGovOrPswdo ? null : ($validated['city_id'] ?? null),
            'brgy_id' => $isGovOrPswdo ? null : ($validated['brgy_id'] ?? null),
        ]);

        return back()->with([
            'status' => "Attendee \"{$attendee->fullname}\" updated successfully!",
        ]);
    }

    /**
     * Remove the specified attendee from storage.
     */
    public function destroy(Attendee $attendee): RedirectResponse
    {
        if ($attendee->status === 'called') {
            return back()->with('error', 'Cannot delete an attendee whose status is called.');
        }

        $name = $attendee->name ?: $attendee->fullname;
        $attendee->delete();

        return back()->with([
            'status' => "Attendee \"{$name}\" was successfully deleted.",
        ]);
    }
}
