<?php

use App\Http\Controllers\Settings\ProfileController;
use App\Http\Controllers\Settings\ProtocolPriorityController;
use App\Http\Controllers\Settings\SecurityController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth'])->group(function () {
    Route::redirect('settings', '/settings/protocol-priority');

    Route::get('settings/protocol-priority', [ProtocolPriorityController::class, 'edit'])->name('settings.protocol-priority.edit');
    Route::put('settings/protocol-priority', [ProtocolPriorityController::class, 'update'])->name('settings.protocol-priority.update');

    Route::inertia('settings/announcer', 'settings/announcer')->name('settings.announcer');

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
