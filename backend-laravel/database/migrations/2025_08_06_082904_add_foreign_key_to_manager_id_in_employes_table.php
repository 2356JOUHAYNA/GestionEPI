<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('employes', function (Blueprint $table) {
            // Assure-toi que la colonne existe déjà
            if (!Schema::hasColumn('employes', 'manager_id')) {
                $table->unsignedBigInteger('manager_id')->nullable()->after('id');
            }

            // Ajoute la contrainte foreign key
            $table->foreign('manager_id')
                  ->references('id')
                  ->on('managers')
                  ->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::table('employes', function (Blueprint $table) {
            $table->dropForeign(['manager_id']);
        });
    }
};
