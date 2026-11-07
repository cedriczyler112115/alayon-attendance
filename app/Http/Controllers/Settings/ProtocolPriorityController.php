<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\GuestCategory;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ProtocolPriorityController extends Controller
{
    /**
     * Display the Protocol Priority Sorting by Category settings page.
     */
    public function edit(Request $request): Response
    {
        $categories = GuestCategory::withCount('attendees')
            ->orderBy('order')
            ->orderBy('id')
            ->get();

        return Inertia::render('settings/protocol-priority', [
            'categories' => $categories,
            'status' => $request->session()->get('status'),
        ]);
    }

    /**
     * Update the sequence order and call modal permissions of guest categories.
     */
    public function update(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'categories' => ['required', 'array', 'min:1'],
            'categories.*.id' => ['required', 'integer', 'exists:guest_categories,id'],
            'categories.*.order' => ['required', 'integer', 'min:1'],
            'categories.*.allow_call' => ['nullable', 'boolean'],
        ]);

        foreach ($validated['categories'] as $item) {
            $updateData = ['order' => $item['order']];
            if (array_key_exists('allow_call', $item)) {
                $updateData['allow_call'] = (bool) $item['allow_call'];
            }
            GuestCategory::where('id', $item['id'])->update($updateData);
        }

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Protocol Priority sorting sequence and call settings saved successfully.',
        ]);

        return back()->with('status', 'Protocol Priority settings updated successfully.');
    }
}
