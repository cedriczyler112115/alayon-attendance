<?php

namespace Database\Seeders;

use App\Models\Event;
use Illuminate\Database\Seeder;

class EventSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        Event::firstOrCreate(
            ['title' => 'Alayon Annual Stakeholders & LGU Leaders Assembly'],
            [
                'theme' => 'Alayon connect: powering progress',
                'venue' => 'Grand Convention Center, Provincial Capitol Complex',
                'event_date' => now()->toDateString(),
                'status' => 'active',
            ]
        );
    }
}
