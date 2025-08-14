<?php
// database/migrations/2025_08_06_130000_alter_stocks_add_missing_columns.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('stocks', function (Blueprint $table) {
            // type_mouvement: enum IN/OUT/ADJ
            if (!Schema::hasColumn('stocks', 'type_mouvement')) {
                $table->enum('type_mouvement', ['IN','OUT','ADJ'])
                      ->default('IN')
                      ->after('materiel_id');
            } else {
                // Si la colonne existe mais n'est pas enum, on tente de la conformer
                // (MySQL uniquement)
                DB::statement("ALTER TABLE `stocks` MODIFY `type_mouvement` ENUM('IN','OUT','ADJ') NOT NULL DEFAULT 'IN'");
            }

            // date_mouvement: date de l'opération
            if (!Schema::hasColumn('stocks', 'date_mouvement')) {
                $table->date('date_mouvement')->after('quantite')->nullable();
            }

            // motif: commentaire libre
            if (!Schema::hasColumn('stocks', 'motif')) {
                $table->string('motif')->nullable()->after('date_mouvement');
            }

            // colonnes morphs (reference_type / reference_id) — nullable
            if (!Schema::hasColumn('stocks', 'reference_type') && !Schema::hasColumn('stocks', 'reference_id')) {
                $table->nullableMorphs('reference'); // crée reference_type (nullable) + reference_id (nullable, unsignedBigInteger)
            }

            // Index utiles
            if (!Schema::hasColumn('stocks', 'materiel_id')) {
                // au cas où… (la plupart du temps existe déjà)
                $table->foreignId('materiel_id')->constrained('materiels')->cascadeOnDelete();
            }

            // Ajout d'index si absents
            $table->index(['materiel_id', 'date_mouvement'], 'stocks_materiel_date_idx');
        });

        // Backfill: si date_mouvement est NULL, on met created_at comme valeur par défaut
        if (Schema::hasColumn('stocks', 'date_mouvement')) {
            DB::statement("UPDATE `stocks` SET `date_mouvement` = DATE(COALESCE(`date_mouvement`, `created_at`)) WHERE `date_mouvement` IS NULL");
        }

        // Sécuriser les valeurs de type_mouvement déjà présentes
        if (Schema::hasColumn('stocks', 'type_mouvement')) {
            DB::statement("UPDATE `stocks` SET `type_mouvement` = 'IN' WHERE `type_mouvement` NOT IN ('IN','OUT','ADJ') OR `type_mouvement` IS NULL");
        }
    }

    public function down(): void
    {
        // On retire proprement ce qu'on a ajouté (sans toucher aux données critiques)
        Schema::table('stocks', function (Blueprint $table) {
            if (Schema::hasColumn('stocks', 'reference_type')) {
                $table->dropColumn('reference_type');
            }
            if (Schema::hasColumn('stocks', 'reference_id')) {
                $table->dropColumn('reference_id');
            }
            if (Schema::hasColumn('stocks', 'motif')) {
                $table->dropColumn('motif');
            }
            if (Schema::hasColumn('stocks', 'date_mouvement')) {
                $table->dropColumn('date_mouvement');
            }
            // On ne supprime pas type_mouvement dans le down pour éviter de casser l'historique,
            // mais si tu veux le faire :
            // if (Schema::hasColumn('stocks', 'type_mouvement')) {
            //     $table->dropColumn('type_mouvement');
            // }

            // drop index si présent
            DB::statement("DROP INDEX IF EXISTS `stocks_materiel_date_idx` ON `stocks`");
        });
    }
};
