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
    if (Schema::hasTable('materiels')) {
        // La table existe déjà -> on ne fait rien
        return;
    }

    Schema::create('materiels', function (Blueprint $table) {
        $table->id();
        $table->string('nom');
        $table->string('taille')->nullable();
        $table->unsignedBigInteger('categorie_id');
        $table->integer('stock_initial');
        $table->timestamps();

        // clé étrangère si besoin
        $table->foreign('categorie_id')->references('id')->on('categories')->onDelete('cascade');
    });
}

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('materiels');
    }
};
