<?php

use App\Models\Attendee;
use App\Models\City;
use App\Models\Event;
use App\Models\GuestCategory;
use App\Models\Province;
use App\Models\User;

beforeEach(function () {
    $this->event = Event::create([
        'title' => 'Alayon Provincial Stakeholders Assembly',
        'theme' => 'Uniting Leaders for Inclusive Progress',
        'venue' => 'Grand Provincial Gymnasium',
        'event_date' => now()->toDateString(),
        'status' => 'active',
    ]);

    $this->govCategory = GuestCategory::create([
        'name' => 'Governors',
        'slug' => 'governors',
        'scope' => 'province',
        'order' => 1,
        'is_active' => true,
    ]);

    $this->mayorCategory = GuestCategory::create([
        'name' => 'Mayors',
        'slug' => 'mayors',
        'scope' => 'municipality',
        'order' => 2,
        'is_active' => true,
    ]);

    $this->pswdoCategory = GuestCategory::create([
        'name' => 'PSWDO',
        'slug' => 'pswdo',
        'scope' => 'province',
        'order' => 3,
        'is_active' => true,
    ]);

    $this->cswdoCategory = GuestCategory::create([
        'name' => 'CSWDO',
        'slug' => 'cswdo',
        'scope' => 'municipality',
        'order' => 4,
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

    $this->host = User::factory()->create([
        'name' => 'Host Emcee',
    ]);
});

test('public attendance kiosk route redirects to attendees', function () {
    $response = $this->get(route('attendance.create'));

    $response->assertRedirect('/attendees');
});

test('guest can register attendance as Governor with simplified fields', function () {
    $response = $this->post(route('attendance.store'), [
        'event_id' => $this->event->id,
        'category_id' => $this->govCategory->id,
        'prefix_name' => 'Gov.',
        'fullname' => 'Ma. Angelica Rosedell Amante',
        'position' => 'Provincial Governor',
        'province_id' => $this->province->prov_code,
    ]);

    $response->assertSessionHas('status');

    $attendee = Attendee::where('fullname', 'Ma. Angelica Rosedell Amante')->first();
    expect($attendee)->not->toBeNull()
        ->and($attendee->fullname)->toBe('Ma. Angelica Rosedell Amante')
        ->and($attendee->prefix_name)->toBe('Gov.')
        ->and($attendee->position)->toBe('Provincial Governor')
        ->and($attendee->status)->toBe('invited')
        ->and($attendee->province_id)->toBe($this->province->prov_code)
        ->and($attendee->is_announced)->toBeFalse();
});

test('guest can register attendance as Mayor with location IDs', function () {
    $response = $this->post(route('attendance.store'), [
        'event_id' => $this->event->id,
        'category_id' => $this->mayorCategory->id,
        'prefix_name' => 'Mayor',
        'fullname' => 'Kirk A. Asis',
        'position' => 'City Mayor',
        'province_id' => $this->province->prov_code,
        'city_id' => $this->city->city_code,
    ]);

    $response->assertSessionHas('status');

    $attendee = Attendee::where('fullname', 'Kirk A. Asis')->first();
    expect($attendee)->not->toBeNull()
        ->and($attendee->fullname)->toBe('Kirk A. Asis')
        ->and($attendee->prefix_name)->toBe('Mayor')
        ->and($attendee->position)->toBe('City Mayor')
        ->and($attendee->status)->toBe('invited')
        ->and($attendee->province_id)->toBe($this->province->prov_code)
        ->and($attendee->city_id)->toBe($this->city->city_code);
});

test('host can view the announcement console', function () {
    $response = $this->actingAs($this->host)->get(route('host.index'));

    $response->assertOk();
});

test('when the host announces a guest it is tagged as called', function () {
    $attendee = Attendee::create([
        'event_id' => $this->event->id,
        'category_id' => $this->govCategory->id,
        'prefix_name' => 'Gov.',
        'fullname' => 'Robert Ace',
        'position' => 'Provincial Governor',
        'status' => 'registered',
        'created_at' => now(),
    ]);

    expect($attendee->status)->toBe('registered')
        ->and($attendee->is_announced)->toBeFalse();

    $response = $this->actingAs($this->host)->post(route('attendees.announce', $attendee));

    $response->assertSessionHas('status');

    $attendee->refresh();
    expect($attendee->status)->toBe('called')
        ->and($attendee->is_announced)->toBeTrue();
});

test('host cannot announce an attendee with invited status', function () {
    $invitedAttendee = Attendee::create([
        'event_id' => $this->event->id,
        'category_id' => $this->govCategory->id,
        'prefix_name' => 'Gov.',
        'fullname' => 'Invited Governor',
        'position' => 'Provincial Governor',
        'status' => 'invited',
        'created_at' => now(),
    ]);

    $response = $this->actingAs($this->host)->post(route('attendees.announce', $invitedAttendee));
    $response->assertSessionHas('error');

    $invitedAttendee->refresh();
    expect($invitedAttendee->status)->toBe('invited')
        ->and($invitedAttendee->is_announced)->toBeFalse();
});

test('host can unannounce a guest if clicked mistakenly', function () {
    $attendee = Attendee::create([
        'event_id' => $this->event->id,
        'category_id' => $this->mayorCategory->id,
        'fullname' => 'Jane Doe',
        'status' => 'called',
        'created_at' => now(),
    ]);

    $response = $this->actingAs($this->host)->post(route('attendees.unannounce', $attendee));

    $response->assertSessionHas('status');

    $attendee->refresh();
    expect($attendee->status)->toBe('registered')
        ->and($attendee->is_announced)->toBeFalse();
});

test('big screen display and polling endpoint return latest called guest', function () {
    $attendee = Attendee::create([
        'event_id' => $this->event->id,
        'category_id' => $this->pswdoCategory->id,
        'prefix_name' => 'Dir.',
        'fullname' => 'Silverio Avila',
        'position' => 'PSWDO Department Head',
        'status' => 'called',
        'created_at' => now(),
    ]);

    $screenResponse = $this->get(route('display'));
    $screenResponse->assertOk();

    $pollResponse = $this->get(route('events.poll', $this->event));
    $pollResponse->assertOk()
        ->assertJsonPath('latest.fullname', 'Silverio Avila')
        ->assertJsonPath('stats.announced', 1);
});

test('categories can be dynamically managed', function () {
    // Create new dynamic category
    $response = $this->actingAs($this->host)->post(route('categories.store'), [
        'name' => 'Board Members',
        'scope' => 'province',
        'description' => 'Sangguniang Panlalawigan Members',
        'order' => 5,
        'is_active' => true,
    ]);

    $response->assertSessionHas('status');

    $category = GuestCategory::where('name', 'Board Members')->first();
    expect($category)->not->toBeNull()
        ->and($category->slug)->toBe('board-members')
        ->and($category->scope)->toBe('province');

    // Update dynamic category
    $this->actingAs($this->host)->put(route('categories.update', $category), [
        'name' => 'SP Board Members',
        'scope' => 'province',
        'description' => 'Updated Description',
        'order' => 5,
        'is_active' => true,
    ]);

    expect($category->fresh()->name)->toBe('SP Board Members');

    // Delete dynamic category
    $this->actingAs($this->host)->delete(route('categories.destroy', $category));
    expect(GuestCategory::where('id', $category->id)->exists())->toBeFalse();
});

test('guest can be registered with invited status and filtered on attendees list', function () {
    $response = $this->actingAs($this->host)->post(route('attendance.store'), [
        'event_id' => $this->event->id,
        'category_id' => $this->govCategory->id,
        'prefix_name' => 'Hon',
        'fullname' => 'Invited Governor Test',
        'position' => 'Provincial Governor',
        'province_id' => $this->province->prov_code,
        'status' => 'invited',
    ]);

    $response->assertSessionHas('status');

    $attendee = Attendee::where('fullname', 'Invited Governor Test')->first();
    expect($attendee)->not->toBeNull()
        ->and($attendee->status)->toBe('invited');

    $indexResponse = $this->actingAs($this->host)->get(route('attendees.index', [
        'status' => 'invited',
        'event_id' => $this->event->id,
    ]));

    $indexResponse->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('attendance/index')
            ->has('attendees.data', 1)
            ->where('attendees.data.0.status', 'invited')
        );
});

test('guest can register attendance with representative when not attending in person', function () {
    $response = $this->actingAs($this->host)->post(route('attendance.store'), [
        'event_id' => $this->event->id,
        'category_id' => $this->mayorCategory->id,
        'prefix_name' => 'Hon',
        'fullname' => 'Mayor Juan Dela Cruz',
        'position' => 'Municipal Mayor',
        'status' => 'invited',
        'is_attending' => false,
        'rep_prefix_name' => 'Mr.',
        'rep_fullname' => 'Pedro Penduko',
        'rep_position' => 'Chief of Staff',
        'province_id' => $this->province->prov_code,
        'city_id' => $this->city->city_code,
    ]);

    $response->assertSessionHas('status');

    $attendee = Attendee::where('fullname', 'Mayor Juan Dela Cruz')->first();
    expect($attendee)->not->toBeNull()
        ->and($attendee->is_attending)->toBeFalse()
        ->and($attendee->rep_prefix_name)->toBe('Mr.')
        ->and($attendee->rep_fullname)->toBe('Pedro Penduko')
        ->and($attendee->rep_position)->toBe('Chief of Staff')
        ->and($attendee->rep_name)->toBe('Mr. Pedro Penduko');

    // Test searching by representative name
    $searchResponse = $this->actingAs($this->host)->get(route('attendees.index', [
        'search' => 'Pedro Penduko',
        'event_id' => $this->event->id,
    ]));

    $searchResponse->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('attendance/index')
            ->has('attendees.data', 1)
            ->where('attendees.data.0.rep_fullname', 'Pedro Penduko')
            ->where('attendees.data.0.is_attending', false)
        );
});

test('attendee can be updated via attendees.update route', function () {
    $attendee = Attendee::create([
        'event_id' => $this->event->id,
        'category_id' => $this->mayorCategory->id,
        'prefix_name' => 'Mayor',
        'fullname' => 'Original Name',
        'position' => 'City Mayor',
        'status' => 'invited',
        'is_attending' => true,
    ]);

    $response = $this->actingAs($this->host)->put(route('attendees.update', $attendee), [
        'event_id' => $this->event->id,
        'category_id' => $this->mayorCategory->id,
        'prefix_name' => 'Hon',
        'fullname' => 'Updated Mayor Name',
        'position' => 'Municipal Mayor',
        'status' => 'registered',
        'is_attending' => false,
        'rep_prefix_name' => 'Ms.',
        'rep_fullname' => 'Anna Santos',
        'rep_position' => 'Executive Secretary',
        'province_id' => $this->province->prov_code,
        'city_id' => $this->city->city_code,
    ]);

    $response->assertSessionHas('status');

    $updated = $attendee->fresh();
    expect($updated->fullname)->toBe('Updated Mayor Name')
        ->and($updated->prefix_name)->toBe('Hon')
        ->and($updated->position)->toBe('Municipal Mayor')
        ->and($updated->status)->toBe('registered')
        ->and($updated->is_attending)->toBeFalse()
        ->and($updated->rep_prefix_name)->toBe('Ms.')
        ->and($updated->rep_fullname)->toBe('Anna Santos')
        ->and($updated->rep_position)->toBe('Executive Secretary');
});

test('attendee can be deleted via attendees.destroy route', function () {
    $attendee = Attendee::create([
        'event_id' => $this->event->id,
        'category_id' => $this->mayorCategory->id,
        'prefix_name' => 'Hon',
        'fullname' => 'Attendee To Delete',
        'position' => 'City Mayor',
        'status' => 'invited',
        'is_attending' => true,
    ]);

    $response = $this->actingAs($this->host)->delete(route('attendees.destroy', $attendee));

    $response->assertSessionHas('status');

    expect(Attendee::find($attendee->id))->toBeNull();
});

test('attendee with called status cannot be updated or deleted', function () {
    $calledAttendee = Attendee::create([
        'event_id' => $this->event->id,
        'category_id' => $this->mayorCategory->id,
        'prefix_name' => 'Hon.',
        'fullname' => 'Called Mayor Juan',
        'position' => 'City Mayor',
        'status' => 'called',
        'is_attending' => true,
    ]);

    // Update should be prevented
    $updateResponse = $this->actingAs($this->host)->put(route('attendees.update', $calledAttendee), [
        'fullname' => 'Hacked Mayor Name',
        'position' => 'City Mayor',
        'category_id' => $this->mayorCategory->id,
        'province_id' => $this->province->prov_code,
        'city_id' => $this->city->city_code,
    ]);
    $updateResponse->assertSessionHas('error', 'Cannot update an attendee whose status is called.');
    expect($calledAttendee->fresh()->fullname)->toBe('Called Mayor Juan');

    // Delete should be prevented
    $deleteResponse = $this->actingAs($this->host)->delete(route('attendees.destroy', $calledAttendee));
    $deleteResponse->assertSessionHas('error', 'Cannot delete an attendee whose status is called.');
    expect(Attendee::find($calledAttendee->id))->not->toBeNull();
});

test('attendee can be registered with category specific agency_name for categories 5, 6, 7, 9, 12', function () {
    $ngaCategory = GuestCategory::create([
        'name' => 'NGAs',
        'slug' => 'ngas',
        'scope' => 'general',
        'order' => 5,
        'is_active' => true,
    ]);

    $response = $this->actingAs($this->host)->post(route('attendance.store'), [
        'event_id' => $this->event->id,
        'category_id' => $ngaCategory->id,
        'prefix_name' => 'Dir.',
        'fullname' => 'Regional Director Maria Santos',
        'position' => 'Regional Director',
        'agency_name' => 'Department of Social Welfare and Development',
        'status' => 'invited',
        'is_attending' => true,
    ]);

    $response->assertSessionHas('status');

    $attendee = Attendee::where('fullname', 'Regional Director Maria Santos')->first();
    expect($attendee)->not->toBeNull()
        ->and($attendee->agency_name)->toBe('Department of Social Welfare and Development')
        ->and($attendee->office_agency)->toBe('Department of Social Welfare and Development');
});

test('attendee with agency_name can be updated', function () {
    $csoCategory = GuestCategory::create([
        'name' => 'CSOs',
        'slug' => 'csos',
        'scope' => 'general',
        'order' => 7,
        'is_active' => true,
    ]);

    $attendee = Attendee::create([
        'event_id' => $this->event->id,
        'category_id' => $csoCategory->id,
        'prefix_name' => 'Mr.',
        'fullname' => 'CSO Leader Juan',
        'position' => 'President',
        'agency_name' => 'Caraga Relief Foundation',
        'status' => 'registered',
        'is_attending' => true,
    ]);

    $response = $this->actingAs($this->host)->put(route('attendees.update', $attendee), [
        'event_id' => $this->event->id,
        'category_id' => $csoCategory->id,
        'prefix_name' => 'Mr.',
        'fullname' => 'CSO Leader Juan Updated',
        'position' => 'Executive Director',
        'agency_name' => 'Updated Caraga Relief Foundation',
        'status' => 'registered',
        'is_attending' => true,
    ]);

    $response->assertSessionHas('status');

    $updated = $attendee->fresh();
    expect($updated->fullname)->toBe('CSO Leader Juan Updated')
        ->and($updated->position)->toBe('Executive Director')
        ->and($updated->agency_name)->toBe('Updated Caraga Relief Foundation');
});

test('attendee can be registered with media name for media partners category id 8', function () {
    $mediaCategory = GuestCategory::create([
        'name' => 'Media Partners',
        'slug' => 'media-partners',
        'scope' => 'general',
        'order' => 8,
        'is_active' => true,
    ]);

    $response = $this->actingAs($this->host)->post(route('attendance.store'), [
        'event_id' => $this->event->id,
        'category_id' => $mediaCategory->id,
        'prefix_name' => 'Mr.',
        'fullname' => 'Pedro Reyes',
        'position' => 'Senior Broadcaster',
        'agency_name' => 'RMN DXBC Butuan',
        'status' => 'invited',
        'is_attending' => true,
    ]);

    $response->assertSessionHas('status');

    $attendee = Attendee::where('fullname', 'Pedro Reyes')->first();
    expect($attendee)->not->toBeNull()
        ->and($attendee->agency_name)->toBe('RMN DXBC Butuan');
});

test('host poll endpoint returns new registered attendees every 5 seconds', function () {
    $existing = Attendee::create([
        'event_id' => $this->event->id,
        'category_id' => $this->govCategory->id,
        'fullname' => 'Existing Governor',
        'status' => 'called',
        'created_at' => now()->subMinutes(10),
    ]);

    $newGuest = Attendee::create([
        'event_id' => $this->event->id,
        'category_id' => $this->mayorCategory->id,
        'prefix_name' => 'Mayor',
        'fullname' => 'Newly Registered Mayor',
        'position' => 'Municipal Mayor',
        'status' => 'registered',
        'created_at' => now(),
    ]);

    $response = $this->get(route('events.host.poll', [
        'event' => $this->event,
        'since_id' => $existing->id,
    ]));

    $response->assertOk()
        ->assertJsonPath('new_attendees.0.id', $newGuest->id)
        ->assertJsonPath('new_attendees.0.fullname', 'Newly Registered Mayor')
        ->assertJsonPath('stats.total', 2)
        ->assertJsonPath('stats.pending', 1)
        ->assertJsonPath('stats.announced', 1);
});

test('host index and poll endpoint order attendees by category protocol priority sequence', function () {
    // Suppose Mayor category has order 1 and Governor has order 2
    $this->mayorCategory->update(['order' => 1]);
    $this->govCategory->update(['order' => 2]);

    $gov = Attendee::create([
        'event_id' => $this->event->id,
        'category_id' => $this->govCategory->id,
        'fullname' => 'Governor Alpha',
        'status' => 'registered',
        'created_at' => now()->subMinutes(5),
    ]);

    $mayor = Attendee::create([
        'event_id' => $this->event->id,
        'category_id' => $this->mayorCategory->id,
        'fullname' => 'Mayor Bravo',
        'status' => 'registered',
        'created_at' => now(), // Arrived later, but higher protocol priority
    ]);

    $response = $this->actingAs($this->host)->get(route('host.index'));

    $response->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('host/index')
            ->where('attendees.0.id', $mayor->id)
            ->where('attendees.1.id', $gov->id)
        );

    $pollResponse = $this->get(route('events.host.poll', ['event' => $this->event]));
    $pollResponse->assertOk()
        ->assertJsonPath('attendees.0.id', $mayor->id)
        ->assertJsonPath('attendees.1.id', $gov->id);
});

test('governor and pswdo categories require province_id on store', function () {
    // 1. Governor without province should fail validation
    $govFail = $this->post(route('attendance.store'), [
        'event_id' => $this->event->id,
        'category_id' => $this->govCategory->id,
        'fullname' => 'Governor Without Province',
        'position' => 'Provincial Governor',
    ]);
    $govFail->assertSessionHasErrors(['province_id' => 'The province field is required.']);

    // 2. PSWDO without province should fail validation
    $pswdoFail = $this->post(route('attendance.store'), [
        'event_id' => $this->event->id,
        'category_id' => $this->pswdoCategory->id,
        'fullname' => 'PSWDO Without Province',
        'position' => 'PSWDO Officer',
    ]);
    $pswdoFail->assertSessionHasErrors(['province_id' => 'The province field is required.']);

    // 3. PSWDO with province should succeed and city_id should be null
    $pswdoSuccess = $this->post(route('attendance.store'), [
        'event_id' => $this->event->id,
        'category_id' => $this->pswdoCategory->id,
        'fullname' => 'PSWDO Officer With Province',
        'position' => 'PSWDO Officer',
        'province_id' => $this->province->prov_code,
        'city_id' => $this->city->city_code, // Even if passed, should be nullified
    ]);
    $pswdoSuccess->assertSessionHas('status');

    $attendee = Attendee::where('fullname', 'PSWDO Officer With Province')->first();
    expect($attendee)->not->toBeNull()
        ->and($attendee->province_id)->toBe($this->province->prov_code)
        ->and($attendee->city_id)->toBeNull();
});

test('mayor and cswdo categories require province_id and city_id on store', function () {
    // 1. Mayor without province or city
    $mayorNoProv = $this->post(route('attendance.store'), [
        'event_id' => $this->event->id,
        'category_id' => $this->mayorCategory->id,
        'fullname' => 'Mayor No Province',
        'position' => 'Municipal Mayor',
        'city_id' => $this->city->city_code,
    ]);
    $mayorNoProv->assertSessionHasErrors(['province_id' => 'The province field is required.']);

    $mayorNoCity = $this->post(route('attendance.store'), [
        'event_id' => $this->event->id,
        'category_id' => $this->mayorCategory->id,
        'fullname' => 'Mayor No City',
        'position' => 'Municipal Mayor',
        'province_id' => $this->province->prov_code,
    ]);
    $mayorNoCity->assertSessionHasErrors(['city_id' => 'The city/municipality field is required.']);

    // 2. CSWDO without province or city
    $cswdoNoProv = $this->post(route('attendance.store'), [
        'event_id' => $this->event->id,
        'category_id' => $this->cswdoCategory->id,
        'fullname' => 'CSWDO No Province',
        'position' => 'CSWDO Head',
        'city_id' => $this->city->city_code,
    ]);
    $cswdoNoProv->assertSessionHasErrors(['province_id' => 'The province field is required.']);

    $cswdoNoCity = $this->post(route('attendance.store'), [
        'event_id' => $this->event->id,
        'category_id' => $this->cswdoCategory->id,
        'fullname' => 'CSWDO No City',
        'position' => 'CSWDO Head',
        'province_id' => $this->province->prov_code,
    ]);
    $cswdoNoCity->assertSessionHasErrors(['city_id' => 'The city/municipality field is required.']);

    // 3. CSWDO with province and city succeeds
    $cswdoSuccess = $this->post(route('attendance.store'), [
        'event_id' => $this->event->id,
        'category_id' => $this->cswdoCategory->id,
        'fullname' => 'CSWDO Head Valid',
        'position' => 'CSWDO Head',
        'province_id' => $this->province->prov_code,
        'city_id' => $this->city->city_code,
    ]);
    $cswdoSuccess->assertSessionHas('status');

    $attendee = Attendee::where('fullname', 'CSWDO Head Valid')->first();
    expect($attendee)->not->toBeNull()
        ->and($attendee->province_id)->toBe($this->province->prov_code)
        ->and($attendee->city_id)->toBe($this->city->city_code);
});

test('updating attendee to mayor or cswdo requires province_id and city_id', function () {
    $attendee = Attendee::create([
        'event_id' => $this->event->id,
        'category_id' => $this->mayorCategory->id,
        'fullname' => 'Initial Mayor',
        'position' => 'City Mayor',
        'province_id' => $this->province->prov_code,
        'city_id' => $this->city->city_code,
        'status' => 'invited',
    ]);

    // Updating without city_id should fail
    $updateFail = $this->actingAs($this->host)->put(route('attendees.update', $attendee), [
        'fullname' => 'Initial Mayor',
        'position' => 'City Mayor',
        'category_id' => $this->mayorCategory->id,
        'province_id' => $this->province->prov_code,
    ]);
    $updateFail->assertSessionHasErrors(['city_id' => 'The city/municipality field is required.']);

    // Updating with both succeeds
    $updateSuccess = $this->actingAs($this->host)->put(route('attendees.update', $attendee), [
        'fullname' => 'Updated Mayor Valid',
        'position' => 'CSWDO Head',
        'category_id' => $this->cswdoCategory->id,
        'province_id' => $this->province->prov_code,
        'city_id' => $this->city->city_code,
    ]);
    $updateSuccess->assertSessionHas('status');

    expect($attendee->fresh()->category_id)->toBe($this->cswdoCategory->id);
});

test('lgu links category requires province_id and city_id on store and update', function () {
    $lguCategory = GuestCategory::create([
        'name' => 'LGU Links',
        'slug' => 'lgu-links',
        'scope' => 'general',
        'order' => 12,
        'is_active' => true,
    ]);

    // 1. Without province should fail
    $failNoProv = $this->post(route('attendance.store'), [
        'event_id' => $this->event->id,
        'category_id' => $lguCategory->id,
        'fullname' => 'LGU Link Without Province',
        'position' => 'LGU Link',
        'city_id' => $this->city->city_code,
    ]);
    $failNoProv->assertSessionHasErrors(['province_id' => 'The province field is required.']);

    // 2. Without city should fail
    $failNoCity = $this->post(route('attendance.store'), [
        'event_id' => $this->event->id,
        'category_id' => $lguCategory->id,
        'fullname' => 'LGU Link Without City',
        'position' => 'LGU Link',
        'province_id' => $this->province->prov_code,
    ]);
    $failNoCity->assertSessionHasErrors(['city_id' => 'The city/municipality field is required.']);

    // 3. With both province and city should succeed
    $success = $this->post(route('attendance.store'), [
        'event_id' => $this->event->id,
        'category_id' => $lguCategory->id,
        'fullname' => 'LGU Link Officer',
        'position' => 'LGU Link',
        'province_id' => $this->province->prov_code,
        'city_id' => $this->city->city_code,
    ]);
    $success->assertSessionHas('status');

    $attendee = Attendee::where('fullname', 'LGU Link Officer')->first();
    expect($attendee)->not->toBeNull()
        ->and($attendee->province_id)->toBe($this->province->prov_code)
        ->and($attendee->city_id)->toBe($this->city->city_code);

    // 4. Updating attendee to LGU links without city should fail
    $updateFail = $this->actingAs($this->host)->put(route('attendees.update', $attendee), [
        'fullname' => 'LGU Link Officer',
        'position' => 'LGU Link',
        'category_id' => $lguCategory->id,
        'province_id' => $this->province->prov_code,
        'city_id' => null,
    ]);
    $updateFail->assertSessionHasErrors(['city_id' => 'The city/municipality field is required.']);
});

test('official position / designation is always required on store and update', function () {
    // 1. Store without position fails
    $fail = $this->post(route('attendance.store'), [
        'event_id' => $this->event->id,
        'category_id' => $this->govCategory->id,
        'fullname' => 'Governor No Position',
        'province_id' => $this->province->prov_code,
    ]);
    $fail->assertSessionHasErrors(['position' => 'The official position / designation field is required.']);

    // 2. Store with position succeeds
    $success = $this->post(route('attendance.store'), [
        'event_id' => $this->event->id,
        'category_id' => $this->govCategory->id,
        'fullname' => 'Governor With Position',
        'position' => 'Provincial Governor',
        'province_id' => $this->province->prov_code,
    ]);
    $success->assertSessionHas('status');

    $attendee = Attendee::where('fullname', 'Governor With Position')->first();
    expect($attendee)->not->toBeNull()
        ->and($attendee->position)->toBe('Provincial Governor');

    // 3. Update without position fails
    $updateFail = $this->actingAs($this->host)->put(route('attendees.update', $attendee), [
        'fullname' => 'Governor With Position',
        'position' => '',
        'category_id' => $this->govCategory->id,
        'province_id' => $this->province->prov_code,
    ]);
    $updateFail->assertSessionHasErrors(['position' => 'The official position / designation field is required.']);
});

test('menu page can be rendered for authenticated users and redirects guests', function () {
    $guestResponse = $this->get(route('menu'));
    $guestResponse->assertRedirect(route('login'));

    $authResponse = $this->actingAs($this->host)->get(route('menu'));
    $authResponse->assertOk()
        ->assertInertia(fn ($page) => $page->component('menu'));
});

test('protocol priority settings can update sequence and allow_call for categories', function () {
    $response = $this->actingAs($this->host)->put(route('settings.protocol-priority.update'), [
        'categories' => [
            [
                'id' => $this->govCategory->id,
                'order' => 1,
                'allow_call' => true,
            ],
            [
                'id' => $this->mayorCategory->id,
                'order' => 2,
                'allow_call' => false,
            ],
        ],
    ]);

    $response->assertRedirect();

    expect($this->govCategory->fresh()->allow_call)->toBeTrue()
        ->and($this->govCategory->fresh()->order)->toBe(1)
        ->and($this->mayorCategory->fresh()->allow_call)->toBeFalse()
        ->and($this->mayorCategory->fresh()->order)->toBe(2);

    // Host index includes allow_call in categories
    $hostIndex = $this->actingAs($this->host)->get(route('host.index'));
    $hostIndex->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('host/index')
            ->where('categories.0.allow_call', true)
            ->where('categories.1.allow_call', false)
        );

    // Host poll endpoint includes allow_call in categories
    $pollResponse = $this->get(route('events.host.poll', ['event' => $this->event]));
    $pollResponse->assertOk()
        ->assertJsonPath('categories.0.allow_call', true)
        ->assertJsonPath('categories.1.allow_call', false);
});

test('attendees print-data endpoint returns filtered data with in-person and representative counts', function () {
    $user = User::factory()->create();

    // 1. Personal attendee (without representative) - registered
    $attendeeInPerson = Attendee::create([
        'event_id' => $this->event->id,
        'category_id' => $this->govCategory->id,
        'fullname' => 'Gov. Angel Amante',
        'position' => 'Provincial Governor',
        'province_id' => $this->province->prov_code,
        'status' => 'registered',
        'registered_at' => now(),
        'is_attending' => true,
    ]);

    // 2. Represented attendee (with representative) - registered
    $attendeeRepresented = Attendee::create([
        'event_id' => $this->event->id,
        'category_id' => $this->mayorCategory->id,
        'fullname' => 'Mayor Judy Amante',
        'position' => 'City Mayor',
        'province_id' => $this->province->prov_code,
        'city_id' => $this->city->city_code,
        'status' => 'registered',
        'registered_at' => now(),
        'is_attending' => false,
        'rep_prefix_name' => 'Atty.',
        'rep_fullname' => 'Pedro Penduko',
        'rep_position' => 'Chief of Staff',
    ]);

    // 3. Attendee with invited status (should be EXCLUDED since print-data filters only status = registered and called)
    $attendeeInvited = Attendee::create([
        'event_id' => $this->event->id,
        'category_id' => $this->pswdoCategory->id,
        'fullname' => 'PSWDO Head Maria Santos',
        'position' => 'PSWDO Head',
        'province_id' => $this->province->prov_code,
        'status' => 'invited',
        'is_attending' => true,
    ]);

    // Test print data - returns only registered attendees
    $response = $this->actingAs($user)->getJson(route('attendees.print-data', [
        'event_id' => $this->event->id,
    ]));

    $response->assertOk()
        ->assertJsonPath('summary.total', 2)
        ->assertJsonPath('summary.in_person', 1)
        ->assertJsonPath('summary.represented', 1)
        ->assertJsonPath('summary.called', 0)
        ->assertJsonPath('summary.registered', 2);

    // Test print data - filter by in_person (without representative)
    $inPersonResponse = $this->actingAs($user)->getJson(route('attendees.print-data', [
        'event_id' => $this->event->id,
        'attendance_mode' => 'without_rep',
    ]));

    $inPersonResponse->assertOk()
        ->assertJsonCount(1, 'attendees')
        ->assertJsonPath('attendees.0.fullname', 'Gov. Angel Amante');

    // Test print data - filter by with_rep (represented)
    $representedResponse = $this->actingAs($user)->getJson(route('attendees.print-data', [
        'event_id' => $this->event->id,
        'attendance_mode' => 'with_rep',
    ]));

    $representedResponse->assertOk()
        ->assertJsonCount(1, 'attendees')
        ->assertJsonPath('attendees.0.fullname', 'Mayor Judy Amante')
        ->assertJsonPath('attendees.0.rep_fullname', 'Pedro Penduko');

    // Test print data - filter by multiple categories (array or comma-separated)
    $multiCategoryResponse = $this->actingAs($user)->getJson(route('attendees.print-data', [
        'event_id' => $this->event->id,
        'category_ids' => "{$this->govCategory->id},{$this->mayorCategory->id}",
    ]));

    $multiCategoryResponse->assertOk()
        ->assertJsonCount(2, 'attendees');

    // Test single category via category_ids
    $singleCategoryResponse = $this->actingAs($user)->getJson(route('attendees.print-data', [
        'event_id' => $this->event->id,
        'category_ids' => "{$this->govCategory->id}",
    ]));

    $singleCategoryResponse->assertOk()
        ->assertJsonCount(1, 'attendees')
        ->assertJsonPath('attendees.0.fullname', 'Gov. Angel Amante');
});

test('attendees print-data endpoint displays both called and registered status attendees', function () {
    $user = User::factory()->create(['role' => 'staff']);

    Attendee::create([
        'event_id' => $this->event->id,
        'category_id' => $this->govCategory->id,
        'fullname' => 'Registered Governor',
        'position' => 'Provincial Governor',
        'province_id' => $this->province->prov_code,
        'status' => 'registered',
        'registered_at' => now(),
        'is_attending' => true,
    ]);

    Attendee::create([
        'event_id' => $this->event->id,
        'category_id' => $this->mayorCategory->id,
        'fullname' => 'Called Mayor',
        'position' => 'City Mayor',
        'province_id' => $this->province->prov_code,
        'city_id' => $this->city->city_code,
        'status' => 'called',
        'registered_at' => now(),
        'is_attending' => true,
    ]);

    Attendee::create([
        'event_id' => $this->event->id,
        'category_id' => $this->pswdoCategory->id,
        'fullname' => 'Invited PSWDO',
        'position' => 'PSWDO Head',
        'province_id' => $this->province->prov_code,
        'status' => 'invited',
        'is_attending' => true,
    ]);

    $response = $this->actingAs($user)->getJson(route('attendees.print-data', [
        'event_id' => $this->event->id,
    ]));

    $response->assertOk()
        ->assertJsonPath('summary.total', 2)
        ->assertJsonPath('summary.called', 1)
        ->assertJsonPath('summary.registered', 1)
        ->assertJsonPath('summary.invited', 0)
        ->assertJsonCount(2, 'attendees');

    $names = collect($response->json('attendees'))->pluck('fullname')->all();
    expect($names)->toContain('Registered Governor')
        ->and($names)->toContain('Called Mayor')
        ->and($names)->not->toContain('Invited PSWDO');
});
