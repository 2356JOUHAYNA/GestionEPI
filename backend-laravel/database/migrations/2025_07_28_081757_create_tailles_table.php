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
    if (Schema::hasTable('tailles')) {
        return; // la table existe déjà -> on ne recrée pas
    }

    Schema::create('tailles', function (Blueprint $table) {
        $table->id();
        $table->unsignedBigInteger('materiel_id');
        $table->string('valeur');              // ou 'nom' selon ton schéma cible
        $table->timestamps();

        $table->foreign('materiel_id')->references('id')->on('materiels')->onDelete('cascade');
    });
}

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tailles');
    }
};
