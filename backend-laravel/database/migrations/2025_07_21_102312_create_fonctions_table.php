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
        if (!Schema::hasTable('affectations')) {
            Schema::create('affectations', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('employe_id');
                $table->date('date');
                $table->string('commentaire')->nullable();
                $table->timestamps();

                // FK (si la table employes existe)
                $table->foreign('employe_id')
                      ->references('id')
                      ->on('employes')
                      ->onDelete('cascade');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('affectations');
    }
};
