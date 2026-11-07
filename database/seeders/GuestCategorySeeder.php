<?php

namespace Database\Seeders;

use App\Models\GuestCategory;
use Illuminate\Database\Seeder;

class GuestCategorySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $categories = [
            [
                'name' => 'Governors',
                'slug' => 'governors',
                'scope' => 'province',
                'description' => 'Provincial Governors and Vice Governors',
                'order' => 1,
                'is_active' => true,
            ],
            [
                'name' => 'Mayors',
                'slug' => 'mayors',
                'scope' => 'municipality',
                'description' => 'City and Municipal Mayors and Vice Mayors',
                'order' => 2,
                'is_active' => true,
            ],
            [
                'name' => 'PSWDO',
                'slug' => 'pswdo',
                'scope' => 'province',
                'description' => 'Provincial Social Welfare and Development Office / Officers',
                'order' => 3,
                'is_active' => true,
            ],
            [
                'name' => 'CSWDO',
                'slug' => 'cswdo',
                'scope' => 'municipality',
                'description' => 'City and Municipal Social Welfare and Development Office / Officers (MSWDO/CSWDO)',
                'order' => 4,
                'is_active' => true,
            ],
        ];

        foreach ($categories as $category) {
            GuestCategory::updateOrCreate(
                ['slug' => $category['slug']],
                $category
            );
        }
    }
}
