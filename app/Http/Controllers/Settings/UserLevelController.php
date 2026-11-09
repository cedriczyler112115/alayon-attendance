<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class UserLevelController extends Controller
{
    /**
     * Display the user level management page.
     */
    public function index(): Response
    {
        $users = User::select('id', 'name', 'firstname', 'middlename', 'lastname', 'email', 'role', 'created_at')
            ->orderBy('name')
            ->get();

        $roles = [
            [
                'value' => 'admin',
                'label' => 'Admin',
                'description' => 'Full access to all system modules, categories, events, and user levels',
            ],
            [
                'value' => 'host',
                'label' => 'Host',
                'description' => 'Access restricted to the Dashboard and Host Announcer stage queuing console',
            ],
            [
                'value' => 'staff',
                'label' => 'Staff',
                'description' => 'Access restricted to Attendance Registry and the Dashboard',
            ],
        ];

        return Inertia::render('settings/users', [
            'users' => $users,
            'roles' => $roles,
        ]);
    }

    /**
     * Update the role / user level for a specific user.
     */
    public function update(Request $request, User $user): RedirectResponse
    {
        $validated = $request->validate([
            'role' => ['required', 'string', 'in:admin,host,staff'],
        ]);

        // Safety guard: prevent the active admin from demoting themselves if no other admin exists
        if ($user->id === $request->user()?->id && $validated['role'] !== 'admin') {
            $otherAdmins = User::where('role', 'admin')->where('id', '!=', $user->id)->count();
            if ($otherAdmins === 0) {
                return back()->withErrors([
                    'role' => 'You cannot remove Admin privileges from yourself as you are the only remaining Administrator.',
                ]);
            }
        }

        $user->update([
            'role' => $validated['role'],
        ]);

        return back()->with('status', "User {$user->name}'s role has been updated to {$user->userlevel}.");
    }
}

