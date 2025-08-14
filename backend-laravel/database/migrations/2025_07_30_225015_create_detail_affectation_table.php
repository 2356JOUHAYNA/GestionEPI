<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('detail_affectations', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('affectation_id');
            $table->unsignedBigInteger('materiel_id');
            $table->unsignedBigInteger('taille_id');
            $table->integer('quantite');
            $table->timestamps();

            // Clés étrangères
            $table->foreign('affectation_id')->references('id')->on('affectations')->onDelete('cascade');
            $table->foreign('materiel_id')->references('id')->on('materiels')->onDelete('cascade');
            $table->foreign('taille_id')->references('id')->on('tailles')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('detail_affectations');
    }
};
