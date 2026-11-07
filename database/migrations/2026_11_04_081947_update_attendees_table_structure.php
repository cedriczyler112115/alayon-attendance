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
        Schema::dropIfExists('attendees');

        Schema::create('attendees', function (Blueprint $table) {
            $table->id();
            $table->foreignId('event_id')->nullable()->constrained('events')->nullOnDelete();
            $table->string('status', 20)->default('registered')->index();
            $table->string('prefix_name', 50)->nullable();
            $table->foreignId('category_id')->constrained('guest_categories')->cascadeOnDelete();
            $table->string('fullname')->index();
            $table->string('position')->nullable();
            $table->integer('province_id')->nullable()->index();
            $table->integer('city_id')->nullable()->index();
            $table->integer('brgy_id')->nullable()->index();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->dateTime('created_at')->nullable();
            $table->timestamp('updated_at')->nullable();

            $table->foreign('province_id')->references('prov_code')->on('lib_provinces')->nullOnDelete();
            $table->foreign('city_id')->references('city_code')->on('lib_cities')->nullOnDelete();
            $table->foreign('brgy_id')->references('brgy_code')->on('lib_brgy')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('attendees');
    }
};
