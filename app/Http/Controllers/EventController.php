<?php

namespace App\Http\Controllers;

use App\Models\Event;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class EventController extends Controller
{
    /**
     * Display a listing of events.
     */
    public function index(): Response
    {
        $events = Event::withCount([
            'attendees',
            'attendees as announced_count' => fn ($q) => $q->where('is_announced', true),
        ])
            ->orderBy('event_date', 'desc')
            ->get();

        return Inertia::render('events/index', [
            'events' => $events,
        ]);
    }

    /**
     * Store a newly created event.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'theme' => ['nullable', 'string', 'max:500'],
            'venue' => ['nullable', 'string', 'max:255'],
            'event_date' => ['required', 'date'],
            'status' => ['required', 'string', 'in:active,completed,archived'],
        ]);

        Event::create($validated);

        return back()->with('status', 'Event created successfully.');
    }

    /**
     * Update the specified event.
     */
    public function update(Request $request, Event $event): RedirectResponse
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'theme' => ['nullable', 'string', 'max:500'],
            'venue' => ['nullable', 'string', 'max:255'],
            'event_date' => ['required', 'date'],
            'status' => ['required', 'string', 'in:active,completed,archived'],
        ]);

        $event->update($validated);

        return back()->with('status', 'Event updated successfully.');
    }
}
