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
        Schema::create('tailles', function (Blueprint $table) {
    $table->id();
    $table->unsignedBigInteger('materiel_id');
    $table->string('valeur'); // ex: "S", "M", "L", "56", "XL"
    $table->timestamps();

    $table->foreign('materiel_id')->references('id')->on('materiels')->onDelete('cascade');
});
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tailles');
    }
};
