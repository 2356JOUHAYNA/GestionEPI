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
    Schema::create('distribution_details', function (Blueprint $table) {
        $table->id();
        $table->foreignId('detail_affectation_id')->constrained('detail_affectations')->onDelete('cascade');
        $table->foreignId('employe_id')->constrained('employes')->onDelete('cascade');
        $table->integer('quantite'); // quantité réellement donnée
        $table->timestamps();
    });
}


    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('distribution_details');
    }
};
