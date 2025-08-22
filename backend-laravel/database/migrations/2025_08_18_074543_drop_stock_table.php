<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::dropIfExists('stock'); // nom actuel de ta table
    }

    public function down(): void
    {
        Schema::create('stock', function (Blueprint $table) {
            $table->id();
            // ajoute ici les colonnes si tu veux la recréer en rollback
            $table->timestamps();
        });
    }
};
