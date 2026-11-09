<?php

use App\Http\Controllers\Settings\ProfileController;
use App\Http\Controllers\Settings\ProtocolPriorityController;
use App\Http\Controllers\Settings\SecurityController;
use App\Http\Controllers\Settings\UserLevelController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth'])->group(function () {
    Route::get('settings', function (Request $request) {
        $user = $request->user();
        if ($user && $user->isAdmin()) {
            return redirect()->route('settings.protocol-priority.edit');
        }
        if ($user && $user->isHost()) {
            return redirect()->route('settings.announcer');
        }

        return redirect()->route('profile.edit');
    })->name('settings');

    // Admin-only Settings Modules
    Route::middleware(['role:admin'])->group(function () {
        Route::get('settings/protocol-priority', [ProtocolPriorityController::class, 'edit'])->name('settings.protocol-priority.edit');
        Route::put('settings/protocol-priority', [ProtocolPriorityController::class, 'update'])->name('settings.protocol-priority.update');

        Route::get('settings/users', [UserLevelController::class, 'index'])->name('settings.users.index');
        Route::put('settings/users/{user}', [UserLevelController::class, 'update'])->name('settings.users.update');
    });

    // Announcer Settings (Accessible to Host and Admin)
    Route::middleware(['role:host,admin'])->group(function () {
        Route::inertia('settings/announcer', 'settings/announcer')->name('settings.announcer');
    });

    // Account Profile Settings
    Route::get('settings/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('settings/profile', [ProfileController::class, 'update'])->name('profile.update');
});

Route::middleware(['auth', 'verified'])->group(function () {
    Route::delete('settings/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    Route::get('settings/security', [SecurityController::class, 'edit'])
        ->name('security.edit');

    Route::put('settings/password', [SecurityController::class, 'update'])
        ->middleware('throttle:6,1')
        ->name('user-password.update');

    Route::inertia('settings/appearance', 'settings/appearance')->name('appearance.edit');
});
