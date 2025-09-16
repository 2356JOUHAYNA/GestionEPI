<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;

return new class extends Migration {
    public function up(): void
    {
        // On NE SUPPRIME PAS la table employes
        if (Schema::hasTable('employes')) {
            return;
        }
    }

    public function down(): void
    {
        // (optionnel) recréer si rollback
        if (!Schema::hasTable('employes')) {
            Schema::create('employes', function (Blueprint $table) {
                $table->id();
                $table->string('matricule');
                $table->string('nom');
                $table->string('prenom');
                $table->timestamps();
            });
        }
    }
};
