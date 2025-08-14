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
        Schema::create('stocks', function (Blueprint $table) {
    $table->id();
    $table->foreignId('materiel_id')->constrained('materiels')->onDelete('cascade');
    $table->enum('type_mouvement', ['entrée', 'sortie']);
    $table->integer('quantite');
    $table->date('date_mouvement');
    $table->text('motif')->nullable();
    $table->timestamps();
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
