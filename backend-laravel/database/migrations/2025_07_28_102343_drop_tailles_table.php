<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
   public function up(): void
{
    // On ne supprime pas la table tailles si elle existe déjà
    if (Schema::hasTable('tailles')) {
        // rien à faire
    }
}


    public function down(): void {
        Schema::create('tailles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('materiel_id')->constrained('materiels')->onDelete('cascade');
            $table->string('libelle');
            $table->timestamps();
        });
    }
};
