<?php

use App\Http\Controllers\AttendanceController;
use App\Http\Controllers\EventController;
use App\Http\Controllers\GuestCategoryController;
use App\Http\Controllers\HostAnnouncementController;
use App\Http\Controllers\LocationController;
use App\Models\Attendee;
use App\Models\Event;
use App\Models\GuestCategory;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::inertia('/', 'welcome')->name('home');

// Attendance Registration Routes (Kiosk removed; redirect to attendees registry)
Route::redirect('attendance', '/attendees')->name('attendance.create');
Route::redirect('events/{event}/attendance', '/attendees')->name('events.attendance.create');
Route::post('attendance', [AttendanceController::class, 'store'])->name('attendance.store');

// Public Big Screen / Projector Display Mode
Route::get('display', [HostAnnouncementController::class, 'display'])->name('display');
Route::get('events/{event}/display', [HostAnnouncementController::class, 'display'])->name('events.display');
Route::get('api/events/{event}/poll', [HostAnnouncementController::class, 'poll'])->name('events.poll');
Route::get('api/events/{event}/host-poll', [HostAnnouncementController::class, 'hostPoll'])->name('events.host.poll');
Route::get('api/host-poll', [HostAnnouncementController::class, 'hostPoll'])->name('host.poll');

// Location Libraries API Routes
Route::get('api/locations/provinces', [LocationController::class, 'provinces'])->name('locations.provinces');
Route::get('api/locations/cities', [LocationController::class, 'cities'])->name('locations.cities');
Route::get('api/locations/barangays', [LocationController::class, 'barangays'])->name('locations.barangays');

// Authenticated Host & Administration Routes
Route::middleware(['auth'])->group(function () {
    // Mobile Application Menu Page
    Route::get('menu', function () {
        return Inertia::render('menu');
    })->name('menu');

    // Dashboard with live event stats
    Route::get('dashboard', function () {
        $activeEvent = Event::where('status', 'active')->latest()->first();

        $categories = GuestCategory::withCount([
            'attendees' => fn ($q) => $activeEvent ? $q->where('event_id', $activeEvent->id) : $q,
            'attendees as announced_count' => fn ($q) => $activeEvent ? $q->where('event_id', $activeEvent->id)->where('status', 'called') : $q->where('status', 'called'),
        ])->orderBy('order')->get();

        $stats = [
            'total_registered' => $activeEvent ? Attendee::where('event_id', $activeEvent->id)->count() : Attendee::count(),
            'total_announced' => $activeEvent ? Attendee::where('event_id', $activeEvent->id)->where('status', 'called')->count() : Attendee::where('status', 'called')->count(),
            'recent_announced' => $activeEvent ? Attendee::with(['category', 'province', 'city'])->where('event_id', $activeEvent->id)->where('status', 'called')->latest('updated_at')->take(5)->get() : Attendee::with(['category', 'province', 'city'])->where('status', 'called')->latest('updated_at')->take(5)->get(),
            'recent_registered' => $activeEvent ? Attendee::with(['category', 'province', 'city'])->where('event_id', $activeEvent->id)->latest('created_at')->take(5)->get() : Attendee::with(['category', 'province', 'city'])->latest('created_at')->take(5)->get(),
        ];

        return Inertia::render('dashboard', [
            'activeEvent' => $activeEvent,
            'categories' => $categories,
            'stats' => $stats,
        ]);
    })->name('dashboard');

    // Host Event Announcement Console
    Route::get('host', [HostAnnouncementController::class, 'index'])->name('host.index');
    Route::get('events/{event}/host', [HostAnnouncementController::class, 'index'])->name('events.host');
    Route::post('attendees/{attendee}/announce', [HostAnnouncementController::class, 'announce'])->name('attendees.announce');
    Route::post('attendees/{attendee}/unannounce', [HostAnnouncementController::class, 'unannounce'])->name('attendees.unannounce');

    // Full Attendees List & Management
    Route::get('attendees', [AttendanceController::class, 'index'])->name('attendees.index');
    Route::put('attendees/{attendee}', [AttendanceController::class, 'update'])->name('attendees.update');
    Route::delete('attendees/{attendee}', [AttendanceController::class, 'destroy'])->name('attendees.destroy');

    // Dynamic Categories Management
    Route::get('categories', [GuestCategoryController::class, 'index'])->name('categories.index');
    Route::post('categories', [GuestCategoryController::class, 'store'])->name('categories.store');
    Route::put('categories/{category}', [GuestCategoryController::class, 'update'])->name('categories.update');
    Route::delete('categories/{category}', [GuestCategoryController::class, 'destroy'])->name('categories.destroy');

    // Events Management
    Route::get('events', [EventController::class, 'index'])->name('events.index');
    Route::post('events', [EventController::class, 'store'])->name('events.store');
    Route::put('events/{event}', [EventController::class, 'update'])->name('events.update');
});

require __DIR__.'/settings.php';
