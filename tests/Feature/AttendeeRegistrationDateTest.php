<?php

use App\Models\Attendee;
use App\Models\City;
use App\Models\Event;
use App\Models\GuestCategory;
use App\Models\Province;
use App\Models\User;

beforeEach(function () {
    $this->user = User::factory()->create();

    $this->event = Event::create([
        'title' => 'Alayon Stakeholders General Assembly',
        'theme' => 'Collaborative Partnerships for Inclusive Community Resilience',
        'venue' => 'Grand Convention Center',
        'event_date' => now()->toDateString(),
        'status' => 'active',
    ]);

    $this->category = GuestCategory::create([
        'name' => 'Governors',
        'slug' => 'governors',
        'scope' => 'province',
        'order' => 1,
        'is_active' => true,
    ]);

    $this->province = Province::firstOrCreate(
        ['prov_code' => 19],
        ['prov_name' => 'Agusan del Norte', 'region_code' => 16]
    );

    $this->city = City::firstOrCreate(
        ['city_code' => 1],
        ['city_name' => 'Cabadbaran City', 'prov_code' => 19, '4p_areas' => 0]
    );
});

test('store attendee logs registered_at when status is registered and null when invited', function () {
    // 1. Storing as invited
    $this->actingAs($this->user)->post(route('attendance.store'), [
        'event_id' => $this->event->id,
        'category_id' => $this->category->id,
        'fullname' => 'Hon. John Doe',
        'position' => 'Governor',
        'province_id' => $this->province->prov_code,
        'status' => 'invited',
        'is_attending' => true,
    ]);

    $invitedAttendee = Attendee::where('fullname', 'Hon. John Doe')->first();
    expect($invitedAttendee)->not->toBeNull()
        ->and($invitedAttendee->status)->toBe('invited')
        ->and($invitedAttendee->registered_at)->toBeNull();

    // 2. Storing as registered
    $this->actingAs($this->user)->post(route('attendance.store'), [
        'event_id' => $this->event->id,
        'category_id' => $this->category->id,
        'fullname' => 'Hon. Jane Smith',
        'position' => 'Governor',
        'province_id' => $this->province->prov_code,
        'status' => 'registered',
        'is_attending' => true,
    ]);

    $registeredAttendee = Attendee::where('fullname', 'Hon. Jane Smith')->first();
    expect($registeredAttendee)->not->toBeNull()
        ->and($registeredAttendee->status)->toBe('registered')
        ->and($registeredAttendee->registered_at)->not->toBeNull();
});

test('updating attendee status from invited to registered logs registered_at timestamp', function () {
    $attendee = Attendee::create([
        'event_id' => $this->event->id,
        'category_id' => $this->category->id,
        'fullname' => 'Hon. Robert Swift',
        'position' => 'Governor',
        'province_id' => $this->province->prov_code,
        'status' => 'invited',
        'registered_at' => null,
        'is_attending' => true,
    ]);

    expect($attendee->registered_at)->toBeNull();

    // Toggle slider on to register attendee
    $response = $this->actingAs($this->user)->put(route('attendees.update', $attendee), [
        'category_id' => $this->category->id,
        'fullname' => 'Hon. Robert Swift',
        'position' => 'Governor',
        'province_id' => $this->province->prov_code,
        'status' => 'registered',
        'is_attending' => true,
    ]);

    $response->assertSessionHasNoErrors();
    $attendee->refresh();

    expect($attendee->status)->toBe('registered')
        ->and($attendee->registered_at)->not->toBeNull();

    // Toggle back to invited clears registered_at
    $this->actingAs($this->user)->put(route('attendees.update', $attendee), [
        'category_id' => $this->category->id,
        'fullname' => 'Hon. Robert Swift',
        'position' => 'Governor',
        'province_id' => $this->province->prov_code,
        'status' => 'invited',
        'is_attending' => true,
    ]);

    $attendee->refresh();
    expect($attendee->status)->toBe('invited')
        ->and($attendee->registered_at)->toBeNull();
});

test('print-data endpoint returns registered_at and supports status filtering', function () {
    // 1. Create invited attendee
    $invited = Attendee::create([
        'event_id' => $this->event->id,
        'category_id' => $this->category->id,
        'fullname' => 'Hon. Invited Guest',
        'position' => 'Governor',
        'province_id' => $this->province->prov_code,
        'status' => 'invited',
        'registered_at' => null,
        'is_attending' => true,
    ]);

    // 2. Create registered attendee with logged registered_at
    $registered = Attendee::create([
        'event_id' => $this->event->id,
        'category_id' => $this->category->id,
        'fullname' => 'Hon. Registered Guest',
        'position' => 'Governor',
        'province_id' => $this->province->prov_code,
        'status' => 'registered',
        'registered_at' => now(),
        'is_attending' => true,
    ]);

    // Query registered only
    $resRegistered = $this->actingAs($this->user)->getJson(route('attendees.print-data', [
        'event_id' => $this->event->id,
        'status' => 'registered',
    ]));

    $resRegistered->assertOk()
        ->assertJsonCount(1, 'attendees')
        ->assertJsonPath('attendees.0.fullname', 'Hon. Registered Guest')
        ->assertJsonPath('attendees.0.registered_at', fn ($val) => ! empty($val));

    // Query invited only
    $resInvited = $this->actingAs($this->user)->getJson(route('attendees.print-data', [
        'event_id' => $this->event->id,
        'status' => 'invited',
    ]));

    $resInvited->assertOk()
        ->assertJsonCount(1, 'attendees')
        ->assertJsonPath('attendees.0.fullname', 'Hon. Invited Guest')
        ->assertJsonPath('attendees.0.registered_at', null);

    // Query all statuses
    $resAll = $this->actingAs($this->user)->getJson(route('attendees.print-data', [
        'event_id' => $this->event->id,
        'status' => 'all',
    ]));

    $resAll->assertOk()
        ->assertJsonCount(2, 'attendees');
});
