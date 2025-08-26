<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // ⚠ supprime la table existante (perte de données)
        Schema::dropIfExists('stocks');

        Schema::create('stocks', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('materiel_id');
            $table->unsignedBigInteger('taille_id')->nullable();
            $table->enum('type_mouvement', ['IN', 'OUT', 'ADJ']);
            $table->unsignedInteger('quantite');
            $table->date('date_mouvement');
            $table->string('motif', 255)->nullable();
            $table->string('reference_type', 100)->nullable();
            $table->unsignedBigInteger('reference_id')->nullable();
            $table->timestamps();

            $table->foreign('materiel_id')->references('id')->on('materiels')->onDelete('cascade');
            $table->foreign('taille_id')->references('id')->on('tailles')->nullOnDelete();

            $table->index(['materiel_id','taille_id'], 'idx_stocks_mat_taille');
            $table->index(['materiel_id','taille_id','date_mouvement'], 'idx_stocks_mat_taille_date');
            $table->index(['type_mouvement','date_mouvement'], 'idx_stocks_type_date');
        });
    }

    public function down(): void
    {
        Schema::table('stocks', function (Blueprint $table) {
            // Supprimer d'abord les FKs pour éviter les erreurs au drop
            $table->dropForeign(['materiel_id']);
            $table->dropForeign(['taille_id']);
            $table->dropIndex('idx_stocks_mat_taille');
            $table->dropIndex('idx_stocks_mat_taille_date');
            $table->dropIndex('idx_stocks_type_date');
        });

        Schema::dropIfExists('stocks');
    }
};
