<?php

use App\Models\Attendee;
use App\Models\Event;
use App\Models\GuestCategory;
use App\Models\User;

beforeEach(function () {
    $this->event = Event::firstOrCreate(
        ['title' => 'Alayon UserLevel Verification Event'],
        [
            'theme' => 'Testing Roles',
            'venue' => 'Capitol Gym',
            'event_date' => now()->toDateString(),
            'status' => 'active',
        ]
    );

    $this->category = GuestCategory::firstOrCreate(
        ['slug' => 'test-category'],
        [
            'name' => 'Test Category',
            'scope' => 'province',
            'order' => 1,
            'is_active' => true,
        ]
    );

    $this->adminUser = User::factory()->admin()->create(['email' => 'admin_test@alayon.gov.ph']);
    $this->hostUser = User::factory()->host()->create(['email' => 'host_test@alayon.gov.ph']);
    $this->staffUser = User::factory()->staff()->create(['email' => 'staff_test@alayon.gov.ph']);
});

// --------------------------------------------------------------------------
// 1. Host Access Control Tests
// --------------------------------------------------------------------------

test('host user can access dashboard and host announcer console', function () {
    $this->actingAs($this->hostUser)->get(route('dashboard'))->assertOk();
    $this->actingAs($this->hostUser)->get(route('host.index'))->assertOk();
    $this->actingAs($this->hostUser)->get(route('settings.announcer'))->assertOk();
});

test('host user is forbidden from attendance registry, categories, events, and user management', function () {
    $this->actingAs($this->hostUser)->get(route('attendees.index'))->assertForbidden();
    $this->actingAs($this->hostUser)->get(route('attendees.print-data'))->assertForbidden();
    $this->actingAs($this->hostUser)->get(route('categories.index'))->assertForbidden();
    $this->actingAs($this->hostUser)->get(route('events.index'))->assertForbidden();
    $this->actingAs($this->hostUser)->get(route('settings.protocol-priority.edit'))->assertForbidden();
    $this->actingAs($this->hostUser)->get(route('settings.users.index'))->assertForbidden();
});

test('host user is forbidden from registering attendees', function () {
    $response = $this->actingAs($this->hostUser)->post(route('attendance.store'), [
        'event_id' => $this->event->id,
        'category_id' => $this->category->id,
        'fullname' => 'Forbidden Host Registration',
        'position' => 'Visitor',
    ]);

    $response->assertForbidden();
});

// --------------------------------------------------------------------------
// 2. Staff Access Control Tests
// --------------------------------------------------------------------------

test('staff user can access dashboard and attendance registry', function () {
    $this->actingAs($this->staffUser)->get(route('dashboard'))->assertOk();
    $this->actingAs($this->staffUser)->get(route('attendees.index'))->assertOk();
    $this->actingAs($this->staffUser)->get(route('attendees.print-data'))->assertOk();
    $this->actingAs($this->staffUser)->get(route('profile.edit'))->assertOk();
});

test('staff user is forbidden from host announcer, categories, events, and user management', function () {
    $this->actingAs($this->staffUser)->get(route('host.index'))->assertForbidden();
    $this->actingAs($this->staffUser)->get(route('categories.index'))->assertForbidden();
    $this->actingAs($this->staffUser)->get(route('events.index'))->assertForbidden();
    $this->actingAs($this->staffUser)->get(route('settings.announcer'))->assertForbidden();
    $this->actingAs($this->staffUser)->get(route('settings.protocol-priority.edit'))->assertForbidden();
    $this->actingAs($this->staffUser)->get(route('settings.users.index'))->assertForbidden();
});

test('staff user can register attendees', function () {
    $response = $this->actingAs($this->staffUser)->post(route('attendance.store'), [
        'event_id' => $this->event->id,
        'category_id' => $this->category->id,
        'fullname' => 'Staff Registered Guest',
        'position' => 'Provincial Officer',
    ]);

    $response->assertSessionHas('status');
    expect(Attendee::where('fullname', 'Staff Registered Guest')->exists())->toBeTrue();
});

// --------------------------------------------------------------------------
// 3. Admin Access Control Tests
// --------------------------------------------------------------------------

test('admin user has access to all modules and sections', function () {
    $this->actingAs($this->adminUser)->get(route('dashboard'))->assertOk();
    $this->actingAs($this->adminUser)->get(route('host.index'))->assertOk();
    $this->actingAs($this->adminUser)->get(route('attendees.index'))->assertOk();
    $this->actingAs($this->adminUser)->get(route('attendees.print-data'))->assertOk();
    $this->actingAs($this->adminUser)->get(route('categories.index'))->assertOk();
    $this->actingAs($this->adminUser)->get(route('events.index'))->assertOk();
    $this->actingAs($this->adminUser)->get(route('settings.protocol-priority.edit'))->assertOk();
    $this->actingAs($this->adminUser)->get(route('settings.announcer'))->assertOk();
    $this->actingAs($this->adminUser)->get(route('settings.users.index'))->assertOk();
});

test('admin user can update another user role', function () {
    $targetUser = User::factory()->staff()->create(['email' => 'target_staff@alayon.gov.ph']);
    expect($targetUser->role)->toBe('staff');

    $response = $this->actingAs($this->adminUser)->put(route('settings.users.update', $targetUser), [
        'role' => 'host',
    ]);

    $response->assertSessionHas('status');
    expect($targetUser->fresh()->role)->toBe('host');
});

// --------------------------------------------------------------------------
// 4. Smart Settings Redirect Tests
// --------------------------------------------------------------------------

test('settings root redirects users to their appropriate landing area', function () {
    $this->actingAs($this->adminUser)->get(route('settings'))
        ->assertRedirect(route('settings.protocol-priority.edit'));

    $this->actingAs($this->hostUser)->get(route('settings'))
        ->assertRedirect(route('settings.announcer'));

    $this->actingAs($this->staffUser)->get(route('settings'))
        ->assertRedirect(route('profile.edit'));
});

