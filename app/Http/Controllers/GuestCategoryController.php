<?php

namespace App\Http\Controllers;

use App\Models\GuestCategory;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class GuestCategoryController extends Controller
{
    /**
     * Display a listing of dynamic guest categories.
     */
    public function index(): Response
    {
        $categories = GuestCategory::withCount('attendees')
            ->orderBy('order')
            ->orderBy('id')
            ->get();

        return Inertia::render('categories/index', [
            'categories' => $categories,
        ]);
    }

    /**
     * Store a newly created category in storage.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', 'unique:guest_categories,name'],
            'scope' => ['required', 'string', 'in:province,municipality,general'],
            'description' => ['nullable', 'string', 'max:500'],
            'order' => ['nullable', 'integer', 'min:0'],
            'is_active' => ['nullable', 'boolean'],
            'allow_call' => ['nullable', 'boolean'],
        ]);

        GuestCategory::create([
            'name' => $validated['name'],
            'slug' => Str::slug($validated['name']),
            'scope' => $validated['scope'],
            'description' => $validated['description'] ?? null,
            'order' => $validated['order'] ?? (GuestCategory::max('order') + 1),
            'is_active' => $request->boolean('is_active', true),
            'allow_call' => $request->boolean('allow_call', true),
        ]);

        return back()->with('status', 'Category created successfully.');
    }

    /**
     * Update the specified category.
     */
    public function update(Request $request, GuestCategory $category): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', 'unique:guest_categories,name,'.$category->id],
            'scope' => ['required', 'string', 'in:province,municipality,general'],
            'description' => ['nullable', 'string', 'max:500'],
            'order' => ['nullable', 'integer', 'min:0'],
            'is_active' => ['nullable', 'boolean'],
            'allow_call' => ['nullable', 'boolean'],
        ]);

        $category->update([
            'name' => $validated['name'],
            'slug' => Str::slug($validated['name']),
            'scope' => $validated['scope'],
            'description' => $validated['description'] ?? null,
            'order' => $validated['order'] ?? $category->order,
            'is_active' => $request->boolean('is_active', true),
            'allow_call' => $request->has('allow_call') ? $request->boolean('allow_call') : $category->allow_call,
        ]);

        return back()->with('status', 'Category updated successfully.');
    }

    /**
     * Remove the specified category.
     */
    public function destroy(GuestCategory $category): RedirectResponse
    {
        if ($category->attendees()->exists()) {
            return back()->withErrors([
                'error' => 'Cannot delete category that currently has registered attendees.',
            ]);
        }

        $category->delete();

        return back()->with('status', 'Category deleted successfully.');
    }
}
