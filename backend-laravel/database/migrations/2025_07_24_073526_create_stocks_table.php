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
    if (Schema::hasTable('stocks')) {
        // La table existe déjà → on ne fait rien
        return;
    }

    Schema::create('stocks', function (Blueprint $table) {
        $table->id();
        $table->unsignedBigInteger('materiel_id');
        $table->enum('type_mouvement', ['entrée', 'sortie']);
        $table->integer('quantite');
        $table->date('date_mouvement');
        $table->text('motif')->nullable();
        $table->timestamps();

        // Clé étrangère si besoin
        $table->foreign('materiel_id')->references('id')->on('materiels')->onDelete('cascade');
    });
}

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('stocks');
    }
};
