<?php

namespace App\Http\Controllers;

use App\Models\Attendee;
use App\Models\Event;
use App\Models\GuestCategory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class HostAnnouncementController extends Controller
{
    /**
     * Display the Host / Emcee announcement console.
     */
    public function index(Request $request, ?Event $event = null): Response
    {
        $event = $event ?? Event::where('status', 'active')->latest()->first() ?? Event::firstOrCreate(
            ['title' => 'Alayon Annual Stakeholders & LGU Leaders Assembly'],
            [
                'theme' => 'Strengthening Collaborative Partnerships for Inclusive Community Resilience',
                'venue' => 'Grand Convention Center, Provincial Capitol Complex',
                'event_date' => now()->toDateString(),
                'status' => 'active',
            ]
        );

        $categories = GuestCategory::where('is_active', true)
            ->orderBy('order')
            ->get();

        $selectedCategory = $request->input('category_id');
        $status = $request->input('status', 'all'); // 'all', 'pending', 'announced'
        $search = $request->input('search');

        $attendeesQuery = Attendee::with(['category', 'province', 'city', 'barangay'])
            ->where('event_id', $event->id)
            ->when($selectedCategory, fn ($q, $cat) => $q->where('category_id', $cat))
            ->when($status === 'pending', fn ($q) => $q->where('status', 'registered'))
            ->when($status === 'announced', fn ($q) => $q->where('status', 'called'))
            ->when($search, function ($q, $term) {
                $q->where(function ($sq) use ($term) {
                    $sq->where('fullname', 'like', "%{$term}%")
                        ->orWhere('position', 'like', "%{$term}%")
                        ->orWhereHas('province', fn ($pq) => $pq->where('prov_name', 'like', "%{$term}%"))
                        ->orWhereHas('city', fn ($cq) => $cq->where('city_name', 'like', "%{$term}%"))
                        ->orWhereHas('barangay', fn ($bq) => $bq->where('brgy_name', 'like', "%{$term}%"));
                });
            });

        $attendees = $attendeesQuery
            ->leftJoin('guest_categories', 'attendees.category_id', '=', 'guest_categories.id')
            ->select('attendees.*')
            ->orderByRaw("CASE WHEN attendees.status != 'called' THEN 0 ELSE 1 END")
            ->orderBy('guest_categories.order', 'asc')
            ->orderBy('attendees.created_at', 'asc')
            ->orderBy('attendees.id', 'asc')
            ->get();

        $latestAnnounced = Attendee::with(['category', 'province', 'city'])
            ->where('event_id', $event->id)
            ->where('status', 'called')
            ->latest('updated_at')
            ->first();

        // Calculate statistics
        $allEventAttendees = Attendee::where('event_id', $event->id)->get(['id', 'category_id', 'status']);
        $totalRegistered = $allEventAttendees->count();
        $totalAnnounced = $allEventAttendees->where('status', 'called')->count();
        $totalPending = $allEventAttendees->where('status', 'registered')->count();

        $categoryStats = $categories->map(function ($cat) use ($allEventAttendees) {
            $catAttendees = $allEventAttendees->where('category_id', $cat->id);

            return [
                'id' => $cat->id,
                'name' => $cat->name,
                'slug' => $cat->slug,
                'scope' => $cat->scope,
                'total' => $catAttendees->count(),
                'announced' => $catAttendees->where('status', 'called')->count(),
                'pending' => $catAttendees->where('status', 'registered')->count(),
            ];
        });

        $events = Event::where('status', 'active')
            ->orderBy('event_date', 'desc')
            ->get(['id', 'title', 'event_date']);

        return Inertia::render('host/index', [
            'event' => $event,
            'events' => $events,
            'categories' => $categories,
            'categoryStats' => $categoryStats,
            'attendees' => $attendees,
            'latestAnnounced' => $latestAnnounced,
            'stats' => [
                'total' => $totalRegistered,
                'announced' => $totalAnnounced,
                'pending' => $totalPending,
            ],
            'filters' => [
                'category_id' => $selectedCategory,
                'status' => $status,
                'search' => $search,
            ],
        ]);
    }

    /**
     * Mark an attendee as announced / called by the host.
     */
    public function announce(Request $request, Attendee $attendee): RedirectResponse
    {
        if ($attendee->status !== 'registered') {
            return back()->with('error', "Cannot call attendee \"{$attendee->name}\": only guests with registered status can be called.");
        }

        $attendee->update([
            'status' => 'called',
        ]);

        $attendee->load(['category', 'province', 'city', 'barangay']);

        return back()->with('status', "Announced: {$attendee->name}");
    }

    /**
     * Revert the status of an attendee to registered.
     */
    public function unannounce(Attendee $attendee): RedirectResponse
    {
        $attendee->update([
            'status' => 'registered',
        ]);

        return back()->with('status', "Reverted announcement for {$attendee->name}");
    }

    /**
     * Display the Big Screen / Projector View for event attendees.
     */
    public function display(Request $request, ?Event $event = null): Response
    {
        $event = $event ?? Event::where('status', 'active')->latest()->first() ?? Event::firstOrCreate(
            ['title' => 'Alayon Annual Stakeholders & LGU Leaders Assembly'],
            [
                'theme' => 'Strengthening Collaborative Partnerships for Inclusive Community Resilience',
                'venue' => 'Grand Convention Center, Provincial Capitol Complex',
                'event_date' => now()->toDateString(),
                'status' => 'active',
            ]
        );

        $latestAnnounced = Attendee::with(['category', 'province', 'city'])
            ->where('event_id', $event->id)
            ->where('status', 'called')
            ->latest('updated_at')
            ->first();

        $recentAnnouncements = Attendee::with(['category', 'province', 'city'])
            ->where('event_id', $event->id)
            ->where('status', 'called')
            ->latest('updated_at')
            ->take(15)
            ->get();

        $categories = GuestCategory::where('is_active', true)->orderBy('order')->get();

        $stats = [
            'total' => Attendee::where('event_id', $event->id)->count(),
            'announced' => Attendee::where('event_id', $event->id)->where('status', 'called')->count(),
        ];

        return Inertia::render('host/display', [
            'event' => $event,
            'latestAnnounced' => $latestAnnounced,
            'recentAnnouncements' => $recentAnnouncements,
            'categories' => $categories,
            'stats' => $stats,
        ]);
    }

    /**
     * Polling endpoint for real-time announcements data on projector screens.
     */
    public function poll(Event $event): JsonResponse
    {
        $latest = Attendee::with(['category', 'province', 'city'])
            ->where('event_id', $event->id)
            ->where('status', 'called')
            ->latest('updated_at')
            ->first();

        $recents = Attendee::with(['category', 'province', 'city'])
            ->where('event_id', $event->id)
            ->where('status', 'called')
            ->latest('updated_at')
            ->take(10)
            ->get();

        $stats = [
            'total' => Attendee::where('event_id', $event->id)->count(),
            'announced' => Attendee::where('event_id', $event->id)->where('status', 'called')->count(),
        ];

        return response()->json([
            'latest' => $latest,
            'recent' => $recents,
            'stats' => $stats,
        ]);
    }

    /**
     * Polling endpoint for host console to detect newly registered attendees every 5 seconds.
     */
    public function hostPoll(Request $request, ?Event $event = null): JsonResponse
    {
        $event = $event ?? Event::where('status', 'active')->latest()->first();

        if (! $event) {
            return response()->json([
                'new_attendees' => [],
                'attendees' => [],
                'stats' => ['total' => 0, 'announced' => 0, 'pending' => 0],
            ]);
        }

        $sinceId = $request->query('since_id');

        $query = Attendee::with(['category', 'province', 'city', 'barangay'])
            ->where('event_id', $event->id);

        $newAttendees = [];
        if ($sinceId) {
            $newAttendees = (clone $query)
                ->where('attendees.id', '>', (int) $sinceId)
                ->where('attendees.status', 'registered')
                ->leftJoin('guest_categories', 'attendees.category_id', '=', 'guest_categories.id')
                ->select('attendees.*')
                ->orderBy('guest_categories.order', 'asc')
                ->orderBy('attendees.created_at', 'asc')
                ->orderBy('attendees.id', 'asc')
                ->get();
        }

        $allAttendees = (clone $query)
            ->leftJoin('guest_categories', 'attendees.category_id', '=', 'guest_categories.id')
            ->select('attendees.*')
            ->orderByRaw("CASE WHEN attendees.status != 'called' THEN 0 ELSE 1 END")
            ->orderBy('guest_categories.order', 'asc')
            ->orderBy('attendees.created_at', 'asc')
            ->orderBy('attendees.id', 'asc')
            ->get();

        $categories = GuestCategory::where('is_active', true)
            ->orderBy('order')
            ->get();

        $stats = [
            'total' => $allAttendees->count(),
            'announced' => $allAttendees->where('status', 'called')->count(),
            'pending' => $allAttendees->where('status', 'registered')->count(),
        ];

        return response()->json([
            'new_attendees' => $newAttendees,
            'attendees' => $allAttendees,
            'categories' => $categories,
            'stats' => $stats,
        ])->header('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0')
            ->header('Pragma', 'no-cache')
            ->header('Expires', '0');
    }
}
