<?php

use App\Models\User;

test('announcer settings page requires authentication', function () {
    $response = $this->get('/settings/announcer');

    $response->assertRedirect('/login');
});

test('announcer settings page is displayed for authenticated users', function () {
    $user = User::factory()->create();

    $response = $this
        ->actingAs($user)
        ->get('/settings/announcer');

    $response->assertOk();
});
