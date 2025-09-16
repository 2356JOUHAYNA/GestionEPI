<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('employes', function (Blueprint $table) {
            // Ajoute la colonne seulement si elle n'existe pas
            if (!Schema::hasColumn('employes', 'fonction_id')) {
                $table->foreignId('fonction_id')
                      ->nullable()
                      ->after('manager_id')
                      ->constrained('fonctions')   // référence la table 'fonctions'
                      ->nullOnDelete();            // si une fonction est supprimée -> NULL
            }
        });
    }

    public function down(): void
    {
        Schema::table('employes', function (Blueprint $table) {
            if (Schema::hasColumn('employes', 'fonction_id')) {
                $table->dropForeign(['fonction_id']);
                $table->dropColumn('fonction_id');
            }
        });
    }
};
