<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Ne crée la table que si elle n'existe pas (pas de perte de données)
        if (!Schema::hasTable('employes')) {
            Schema::create('employes', function (Blueprint $table) {
                $table->id();
                $table->string('matricule');   // tu ajouteras l'unicité dans une migration séparée si besoin
                $table->string('nom');
                $table->string('prenom');
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('employes');
    }
};
