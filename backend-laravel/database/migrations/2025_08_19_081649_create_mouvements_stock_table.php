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
        Schema::create('mouvements_stock', function (Blueprint $table) {
            $table->id();

            // Référence vers le matériel
            $table->unsignedBigInteger('materiel_id');

            // Référence vers la taille (optionnelle)
            $table->unsignedBigInteger('taille_id')->nullable();

            // Type de mouvement : IN (entrée) ou OUT (sortie)
            $table->enum('type', ['IN', 'OUT']);

            // Quantité déplacée
            $table->integer('quantite');

            // Date du mouvement
            $table->date('date');

            // Timestamps Laravel (created_at, updated_at)
            $table->timestamps();

            // Contraintes
            $table->foreign('materiel_id')
                  ->references('id')->on('materiels')
                  ->onDelete('cascade');

            $table->foreign('taille_id')
                  ->references('id')->on('tailles')
                  ->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('mouvements_stock');
    }
};
