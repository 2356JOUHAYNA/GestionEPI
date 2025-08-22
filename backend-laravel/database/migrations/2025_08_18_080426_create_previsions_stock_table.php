<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('previsions_stock', function (Blueprint $table) {
            $table->bigIncrements('id');

            $table->unsignedBigInteger('materiel_id');
            $table->unsignedBigInteger('taille_id')->nullable();
            $table->date('periode');                 // 1er jour du mois
            $table->unsignedInteger('qte_prevue');  // yhat
            $table->unsignedInteger('qte_inf')->nullable(); // yhat_lower
            $table->unsignedInteger('qte_sup')->nullable(); // yhat_upper
            $table->string('modele', 32)->nullable();       // 'prophet' / 'moving_avg'
            $table->timestamp('generated_at')->useCurrent();
            $table->timestamps();

            $table->unique(['materiel_id','taille_id','periode'], 'uniq_prev_mat_taille_periode');
            $table->foreign('materiel_id')->references('id')->on('materiels')->onDelete('cascade');
            // $table->foreign('taille_id')->references('id')->on('tailles')->nullOnDelete();

            $table->index(['materiel_id', 'taille_id', 'periode'], 'idx_prev_mat_taille_periode');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('previsions_stock');
    }
};
