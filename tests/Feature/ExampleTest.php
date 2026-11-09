<?php

use App\Models\Event;
use Inertia\Testing\AssertableInertia as Assert;

test('welcome landing page returns a successful response with active event and stats', function () {
    Event::firstOrCreate(
        ['title' => 'Alayon Annual Stakeholders & LGU Leaders Assembly'],
        [
            'theme' => 'Strengthening Collaborative Partnerships for Inclusive Community Resilience',
            'venue' => 'Grand Convention Center, Provincial Capitol Complex',
            'event_date' => now()->toDateString(),
            'status' => 'active',
        ]
    );

    $response = $this->get(route('home'));

    $response->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('welcome')
            ->has('activeEvent')
            ->has('stats.total_registered')
            ->has('stats.total_announced')
            ->has('stats.categories_count')
        );
});
