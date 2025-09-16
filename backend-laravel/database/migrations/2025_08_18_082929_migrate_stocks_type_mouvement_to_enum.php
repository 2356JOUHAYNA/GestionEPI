<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('stocks', function (Blueprint $table) {
            // 1) Ajouter une nouvelle colonne temporaire (string) pour accueillir les nouvelles valeurs
            if (!Schema::hasColumn('stocks', 'type_mouvement_new')) {
                $table->string('type_mouvement_new', 10)->nullable()->after('materiel_id');
            }
        });

        // 2) Mapper les anciennes valeurs vers les nouvelles
        //    - 'entrée'  -> 'IN'
        //    - 'sortie'  -> 'OUT'
        //    - NULL/Autre -> 'ADJ' (ou 'IN' selon ta logique)
        DB::table('stocks')->where('type_mouvement', 'entrée')->update(['type_mouvement_new' => 'IN']);
        DB::table('stocks')->where('type_mouvement', 'sortie')->update(['type_mouvement_new' => 'OUT']);
        DB::table('stocks')->whereNull('type_mouvement')->update(['type_mouvement_new' => 'ADJ']);
        DB::table('stocks')->whereNotIn('type_mouvement', ['entrée','sortie'])->whereNotNull('type_mouvement')
            ->update(['type_mouvement_new' => 'ADJ']);

        // 3) Sécuriser : s'il reste des NULL
        DB::table('stocks')->whereNull('type_mouvement_new')->update(['type_mouvement_new' => 'ADJ']);

        Schema::table('stocks', function (Blueprint $table) {
            // 4) Supprimer l’ancienne colonne ENUM/SET/texte
            if (Schema::hasColumn('stocks', 'type_mouvement')) {
                $table->dropColumn('type_mouvement');
            }
        });

        Schema::table('stocks', function (Blueprint $table) {
            // 5) Recréer la colonne finale en ENUM et la remplir à partir de la colonne temporaire
            // ⚠️ Laravel ne gère pas ENUM nativement en portable → on passe par DB::statement
        });

        // 5bis) Créer la colonne ENUM via SQL, puis copier la valeur
        DB::statement("ALTER TABLE `stocks` ADD `type_mouvement` ENUM('IN','OUT','ADJ') NOT NULL DEFAULT 'IN' AFTER `materiel_id`");

        // 6) Copier les données
        DB::statement("UPDATE `stocks` SET `type_mouvement` = `type_mouvement_new`");

        Schema::table('stocks', function (Blueprint $table) {
            // 7) Supprimer la colonne temporaire
            if (Schema::hasColumn('stocks', 'type_mouvement_new')) {
                $table->dropColumn('type_mouvement_new');
            }
        });
    }

    public function down(): void
    {
        // rollback simple : repasser à une colonne string 'entrée'/'sortie' (optionnel)
        Schema::table('stocks', function (Blueprint $table) {
            $table->string('type_mouvement_old', 20)->nullable()->after('materiel_id');
        });

        // Remapper IN/OUT/ADJ vers entrée/sortie/entrée (ou autre choix)
        DB::table('stocks')->where('type_mouvement', 'IN')->update(['type_mouvement_old' => 'entrée']);
        DB::table('stocks')->where('type_mouvement', 'OUT')->update(['type_mouvement_old' => 'sortie']);
        DB::table('stocks')->where('type_mouvement', 'ADJ')->update(['type_mouvement_old' => 'entrée']);

        Schema::table('stocks', function (Blueprint $table) {
            $table->dropColumn('type_mouvement');
        });

        Schema::table('stocks', function (Blueprint $table) {
            $table->renameColumn('type_mouvement_old', 'type_mouvement');
        });
    }
};
