<?php

use App\Models\Attendee;
use App\Models\Event;
use App\Models\GuestCategory;
use App\Models\User;

test('guest can be registered with invited status', function () {
    $user = User::factory()->create(['role' => 'staff']);
    $event = Event::create([
        'title' => 'Annual Assembly',
        'event_date' => now()->toDateString(),
        'status' => 'active',
    ]);
    $category = GuestCategory::create([
        'name' => 'Diplomats & Special Guests',
        'slug' => 'diplomats',
        'scope' => 'national',
        'order' => 1,
        'is_active' => true,
    ]);

    $response = $this->actingAs($user)->post('/attendance', [
        'event_id' => $event->id,
        'category_id' => $category->id,
        'fullname' => 'Hon. Invited Guest',
        'position' => 'Board Member',
        'is_attending' => true,
        'status' => 'invited',
    ]);

    $response->assertSessionHasNoErrors();
    $attendee = Attendee::where('fullname', 'Hon. Invited Guest')->first();
    expect($attendee)->not->toBeNull()
        ->and($attendee->status)->toBe('invited');
});

test('guest can be registered with registered status via slider', function () {
    $user = User::factory()->create(['role' => 'staff']);
    $event = Event::create([
        'title' => 'Annual Assembly',
        'event_date' => now()->toDateString(),
        'status' => 'active',
    ]);
    $category = GuestCategory::create([
        'name' => 'Diplomats & Special Guests',
        'slug' => 'diplomats',
        'scope' => 'national',
        'order' => 1,
        'is_active' => true,
    ]);

    $response = $this->actingAs($user)->post('/attendance', [
        'event_id' => $event->id,
        'category_id' => $category->id,
        'fullname' => 'Hon. Attending Guest',
        'position' => 'Vice Mayor',
        'is_attending' => true,
        'status' => 'registered',
    ]);

    $response->assertSessionHasNoErrors();
    $attendee = Attendee::where('fullname', 'Hon. Attending Guest')->first();
    expect($attendee)->not->toBeNull()
        ->and($attendee->status)->toBe('registered');
});

test('attendee status can be toggled between invited and registered via update', function () {
    $user = User::factory()->create(['role' => 'staff']);
    $event = Event::create([
        'title' => 'Annual Assembly',
        'event_date' => now()->toDateString(),
        'status' => 'active',
    ]);
    $category = GuestCategory::create([
        'name' => 'Diplomats & Special Guests',
        'slug' => 'diplomats',
        'scope' => 'national',
        'order' => 1,
        'is_active' => true,
    ]);

    $attendee = Attendee::factory()->create([
        'event_id' => $event->id,
        'category_id' => $category->id,
        'fullname' => 'Status Toggle Test',
        'position' => 'Councilor',
        'status' => 'invited',
        'is_attending' => true,
    ]);

    // Toggle ON -> registered
    $response = $this->actingAs($user)->put("/attendees/{$attendee->id}", [
        'event_id' => $event->id,
        'category_id' => $category->id,
        'fullname' => 'Status Toggle Test',
        'position' => 'Councilor',
        'is_attending' => true,
        'status' => 'registered',
    ]);

    $response->assertSessionHasNoErrors();
    expect($attendee->fresh()->status)->toBe('registered');

    // Toggle OFF -> invited
    $response = $this->actingAs($user)->put("/attendees/{$attendee->id}", [
        'event_id' => $event->id,
        'category_id' => $category->id,
        'fullname' => 'Status Toggle Test',
        'position' => 'Councilor',
        'is_attending' => true,
        'status' => 'invited',
    ]);

    $response->assertSessionHasNoErrors();
    expect($attendee->fresh()->status)->toBe('invited');
});
