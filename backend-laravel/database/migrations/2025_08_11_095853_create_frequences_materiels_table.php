<?php
// database/migrations/2025_08_11_000000_create_frequences_materiels_table.php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('frequences_materiels', function (Blueprint $table) {
            $table->id();
            $table->foreignId('materiel_id')->constrained('materiels')->onDelete('cascade');
            $table->unsignedSmallInteger('nombre_mois'); // ex: 6 = tous les 6 mois
            $table->date('date_debut')->nullable(); // si la règle commence à une date spécifique
            $table->date('date_fin')->nullable(); // si elle prend fin
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('frequences_materiels');
    }
};
