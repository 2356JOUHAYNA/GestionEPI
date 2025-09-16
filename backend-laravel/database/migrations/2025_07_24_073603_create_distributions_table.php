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
    if (Schema::hasTable('distributions')) {
        // La table existe déjà → on arrête
        return;
    }

    Schema::create('distributions', function (Blueprint $table) {
        $table->id();
        $table->unsignedBigInteger('affectation_id');
        $table->unsignedBigInteger('materiel_id');
        $table->integer('quantite');
        $table->string('taille')->nullable();
        $table->string('mois_distribution');
        $table->text('signature_employe')->nullable();
        $table->timestamps();

        // Clés étrangères si besoin
        $table->foreign('affectation_id')->references('id')->on('affectations')->onDelete('cascade');
        $table->foreign('materiel_id')->references('id')->on('materiels')->onDelete('cascade');
    });
}


    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('distributions');
    }
};
