<?php

namespace Database\Factories;

use App\Models\Attendee;
use App\Models\Event;
use App\Models\GuestCategory;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Attendee>
 */
class AttendeeFactory extends Factory
{
    protected $model = Attendee::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'event_id' => Event::factory(),
            'status' => 'registered',
            'prefix_name' => fake()->randomElement(['Hon', 'Gov.', 'Mayor', 'Mr.', 'Ms.']),
            'category_id' => GuestCategory::factory(),
            'fullname' => fake()->name(),
            'position' => fake()->jobTitle(),
            'province_id' => null,
            'city_id' => null,
            'brgy_id' => null,
            'created_at' => now(),
        ];
    }
}
