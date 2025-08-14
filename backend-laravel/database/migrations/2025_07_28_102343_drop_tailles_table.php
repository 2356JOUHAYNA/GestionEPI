<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::dropIfExists('tailles');
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
