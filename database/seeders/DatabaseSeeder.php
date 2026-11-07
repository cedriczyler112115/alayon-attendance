<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            GuestCategorySeeder::class,
            EventSeeder::class,
        ]);

        if (User::where('email', 'admin@alayon.gov.ph')->doesntExist()) {
            User::factory()->create([
                'firstname' => 'Admin',
                'lastname' => 'Host',
                'name' => 'Admin Host',
                'email' => 'admin@alayon.gov.ph',
            ]);
        }
    }
}
