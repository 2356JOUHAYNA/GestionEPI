<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
  public function up(): void
{
    if (Schema::hasTable('tailles')) {
        // La table existe déjà -> on ne fait rien
        return;
    }

    Schema::create('tailles', function (Blueprint $table) {
        $table->id();
        $table->unsignedBigInteger('materiel_id');
        $table->string('nom');  // ou 'valeur' selon ton schéma
        $table->integer('quantite')->default(0);
        $table->timestamps();

        $table->foreign('materiel_id')
              ->references('id')
              ->on('materiels')
              ->onDelete('cascade');
    });
}

    public function down(): void
    {
        Schema::dropIfExists('tailles');
    }
};
