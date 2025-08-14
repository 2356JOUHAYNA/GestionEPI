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
        Schema::table('affectations', function (Blueprint $table) {
            if (!Schema::hasColumn('affectations', 'manager_id')) {
                $table->unsignedBigInteger('manager_id')->nullable()->after('employe_id');

                $table->foreign('manager_id')
                    ->references('id')->on('managers')
                    ->onDelete('set null');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('affectations', function (Blueprint $table) {
            if (Schema::hasColumn('affectations', 'manager_id')) {
                $table->dropForeign(['manager_id']);
                $table->dropColumn('manager_id');
            }
        });
    }
};
