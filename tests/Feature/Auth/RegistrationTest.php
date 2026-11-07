<?php

use App\Models\User;

test('registration screen can be rendered', function () {
    $response = $this->get(route('register'));

    $response->assertOk();
});

test('new users can register with firstname, middlename, lastname, email and password', function () {
    $response = $this->post(route('register.store'), [
        'firstname' => 'Juan',
        'middlename' => 'Protacio',
        'lastname' => 'Rizal',
        'email' => 'juan.rizal@example.com',
        'password' => 'password',
        'password_confirmation' => 'password',
    ]);

    $this->assertAuthenticated();
    $response->assertRedirect(route('dashboard', absolute: false));

    $user = User::where('email', 'juan.rizal@example.com')->first();
    expect($user)->not->toBeNull()
        ->and($user->firstname)->toBe('Juan')
        ->and($user->middlename)->toBe('Protacio')
        ->and($user->lastname)->toBe('Rizal')
        ->and($user->name)->toBe('Juan Protacio Rizal')
        ->and($user->email_verified_at)->not->toBeNull();

    // Verify user can directly access dashboard without approval or verification barrier
    $dashboardResponse = $this->get(route('dashboard'));
    $dashboardResponse->assertOk();
});

test('new users can register without middlename', function () {
    $response = $this->post(route('register.store'), [
        'firstname' => 'Maria',
        'middlename' => null,
        'lastname' => 'Santos',
        'email' => 'maria.santos@example.com',
        'password' => 'password',
        'password_confirmation' => 'password',
    ]);

    $this->assertAuthenticated();
    $response->assertRedirect(route('dashboard', absolute: false));

    $user = User::where('email', 'maria.santos@example.com')->first();
    expect($user)->not->toBeNull()
        ->and($user->firstname)->toBe('Maria')
        ->and($user->middlename)->toBeNull()
        ->and($user->lastname)->toBe('Santos')
        ->and($user->name)->toBe('Maria Santos');
});

test('registration fails if required fields are missing', function () {
    $response = $this->post(route('register.store'), [
        'firstname' => '',
        'lastname' => '',
        'email' => 'not-an-email',
        'password' => 'password',
        'password_confirmation' => 'different-password',
    ]);

    $response->assertSessionHasErrors(['firstname', 'lastname', 'email', 'password']);
    $this->assertGuest();
});
