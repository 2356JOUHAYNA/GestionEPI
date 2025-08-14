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
        Schema::create('distributions', function (Blueprint $table) {
    $table->id();
    $table->foreignId('affectation_id')->constrained('affectations')->onDelete('cascade');
    $table->foreignId('materiel_id')->constrained('materiels')->onDelete('cascade');
    $table->integer('quantite');
    $table->string('taille')->nullable();
    $table->string('mois_distribution');
    $table->text('signature_employe')->nullable();
    $table->timestamps();
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
