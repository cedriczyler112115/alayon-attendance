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
        Schema::table('attendees', function (Blueprint $table) {
            $table->boolean('is_attending')->default(true)->after('status');
            $table->string('rep_prefix_name', 50)->nullable()->after('position');
            $table->string('rep_fullname', 255)->nullable()->after('rep_prefix_name');
            $table->string('rep_position', 255)->nullable()->after('rep_fullname');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('attendees', function (Blueprint $table) {
            $table->dropColumn(['is_attending', 'rep_prefix_name', 'rep_fullname', 'rep_position']);
        });
    }
};
