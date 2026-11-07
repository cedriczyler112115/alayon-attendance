<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (! Schema::hasTable('lib_provinces')) {
            Schema::create('lib_provinces', function (Blueprint $table) {
                $table->integer('prov_code')->primary();
                $table->string('prov_name', 60)->index();
                $table->char('psgc_prv', 9)->nullable()->unique();
                $table->integer('region_code')->nullable()->index();
            });
        }

        if (! Schema::hasTable('lib_cities')) {
            Schema::create('lib_cities', function (Blueprint $table) {
                $table->integer('city_code')->primary();
                $table->string('city_name', 100)->index();
                $table->tinyInteger('is_Urban')->default(0);
                $table->tinyInteger('locked')->default(0);
                $table->integer('app_target_hh')->nullable();
                $table->tinyInteger('4p_areas')->default(0);
                $table->char('psgc_cty', 9)->nullable()->unique();
                $table->integer('prov_code')->index();
            });
        }

        if (! Schema::hasTable('lib_brgy')) {
            Schema::create('lib_brgy', function (Blueprint $table) {
                $table->integer('brgy_code')->primary();
                $table->string('brgy_name', 100)->index();
                $table->tinyInteger('brgy_mode')->default(1);
                $table->tinyInteger('urb_rur')->default(0);
                $table->char('psgc_bgy', 11)->nullable()->unique();
                $table->integer('city_code')->index();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Keep existing library data intact
    }
};
