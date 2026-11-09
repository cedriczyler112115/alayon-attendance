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

Route::get('/', function () {
    $activeEvent = Event::where('status', 'active')->latest()->first() ?? Event::first();

    $categoriesCount = GuestCategory::where('is_active', true)->count();
    $totalRegistered = $activeEvent ? Attendee::where('event_id', $activeEvent->id)->count() : Attendee::count();
    $totalAnnounced = $activeEvent ? Attendee::where('event_id', $activeEvent->id)->where('status', 'called')->count() : Attendee::where('status', 'called')->count();

    return Inertia::render('welcome', [
        'activeEvent' => $activeEvent,
        'stats' => [
            'total_registered' => $totalRegistered,
            'total_announced' => $totalAnnounced,
            'categories_count' => $categoriesCount,
        ],
    ]);
})->name('home');

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

// Progressive Web App (PWA) Fallback Routes
Route::get('sw.js', function () {
    $swPath = public_path('sw.js');
    if (! file_exists($swPath)) {
        $swPath = public_path('build/sw.js');
    }

    if (file_exists($swPath)) {
        return response()->file($swPath, [
            'Content-Type' => 'application/javascript',
            'Service-Worker-Allowed' => '/',
            'Cache-Control' => 'no-cache, no-store, must-revalidate',
        ]);
    }

    abort(404);
})->name('pwa.sw');

Route::get('workbox-{hash}.js', function ($hash) {
    $swPath = public_path("workbox-{$hash}.js");
    if (! file_exists($swPath)) {
        $swPath = public_path("build/workbox-{$hash}.js");
    }

    if (file_exists($swPath)) {
        return response()->file($swPath, [
            'Content-Type' => 'application/javascript',
            'Service-Worker-Allowed' => '/',
            'Cache-Control' => 'no-cache, no-store, must-revalidate',
        ]);
    }

    abort(404);
})->where('hash', '[a-zA-Z0-9_-]+')->name('pwa.workbox');

Route::get('manifest.webmanifest', function () {
    $manifestPath = public_path('manifest.webmanifest');
    if (! file_exists($manifestPath)) {
        $manifestPath = public_path('build/manifest.webmanifest');
    }

    if (file_exists($manifestPath)) {
        return response()->file($manifestPath, [
            'Content-Type' => 'application/manifest+json',
            'Cache-Control' => 'no-cache, no-store, must-revalidate',
        ]);
    }

    abort(404);
})->name('pwa.manifest');

Route::get('manifest.json', function () {
    $manifestPath = public_path('manifest.webmanifest');
    if (! file_exists($manifestPath)) {
        $manifestPath = public_path('manifest.json');
    }
    if (! file_exists($manifestPath)) {
        $manifestPath = public_path('build/manifest.webmanifest');
    }

    if (file_exists($manifestPath)) {
        return response()->file($manifestPath, [
            'Content-Type' => 'application/manifest+json',
            'Cache-Control' => 'no-cache, no-store, must-revalidate',
        ]);
    }

    abort(404);
})->name('pwa.manifest.json');

// Asset fallback route: transparently maps /assets/{path} to /build/assets/{path}
Route::get('assets/{path}', function ($path) {
    $filePath = public_path("build/assets/{$path}");
    if (file_exists($filePath)) {
        $extension = strtolower(pathinfo($filePath, PATHINFO_EXTENSION));
        $mimeTypes = [
            'js' => 'application/javascript',
            'css' => 'text/css',
            'woff' => 'font/woff',
            'woff2' => 'font/woff2',
            'svg' => 'image/svg+xml',
            'png' => 'image/png',
            'jpg' => 'image/jpeg',
            'jpeg' => 'image/jpeg',
            'webp' => 'image/webp',
            'ico' => 'image/x-icon',
            'json' => 'application/json',
        ];
        $contentType = $mimeTypes[$extension] ?? 'application/octet-stream';

        return response()->file($filePath, [
            'Content-Type' => $contentType,
            'Cache-Control' => 'public, max-age=31536000, immutable',
        ]);
    }

    abort(404);
})->where('path', '.*')->name('pwa.assets.fallback');

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

    // Host Event Announcement Console (Host and Admin)
    Route::middleware(['role:host,admin'])->group(function () {
        Route::get('host', [HostAnnouncementController::class, 'index'])->name('host.index');
        Route::get('events/{event}/host', [HostAnnouncementController::class, 'index'])->name('events.host');
        Route::post('attendees/{attendee}/announce', [HostAnnouncementController::class, 'announce'])->name('attendees.announce');
        Route::post('attendees/{attendee}/unannounce', [HostAnnouncementController::class, 'unannounce'])->name('attendees.unannounce');
    });

    // Attendance Registry & Attendee Management (Staff and Admin)
    Route::middleware(['role:staff,admin'])->group(function () {
        Route::get('attendees', [AttendanceController::class, 'index'])->name('attendees.index');
        Route::get('attendees/print-data', [AttendanceController::class, 'printData'])->name('attendees.print-data');
        Route::put('attendees/{attendee}', [AttendanceController::class, 'update'])->name('attendees.update');
        Route::delete('attendees/{attendee}', [AttendanceController::class, 'destroy'])->name('attendees.destroy');
    });

    // Dynamic Categories & Events Management (Admin Only)
    Route::middleware(['role:admin'])->group(function () {
        Route::get('categories', [GuestCategoryController::class, 'index'])->name('categories.index');
        Route::post('categories', [GuestCategoryController::class, 'store'])->name('categories.store');
        Route::put('categories/{category}', [GuestCategoryController::class, 'update'])->name('categories.update');
        Route::delete('categories/{category}', [GuestCategoryController::class, 'destroy'])->name('categories.destroy');

        Route::get('events', [EventController::class, 'index'])->name('events.index');
        Route::post('events', [EventController::class, 'store'])->name('events.store');
        Route::put('events/{event}', [EventController::class, 'update'])->name('events.update');
    });
});

require __DIR__.'/settings.php';
