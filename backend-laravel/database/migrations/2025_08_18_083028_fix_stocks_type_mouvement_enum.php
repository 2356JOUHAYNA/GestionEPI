<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        // 1) élargir l'ENUM pour accepter aussi 'entrée' et 'sortie'
        DB::statement("ALTER TABLE `stocks` 
            MODIFY `type_mouvement` ENUM('IN','OUT','ADJ','entrée','sortie') NOT NULL DEFAULT 'IN'");

        // 2) convertir les anciennes valeurs vers le nouveau standard
        DB::table('stocks')->where('type_mouvement', 'entrée')->update(['type_mouvement' => 'IN']);
        DB::table('stocks')->where('type_mouvement', 'sortie')->update(['type_mouvement' => 'OUT']);

        // 3) restreindre l'ENUM à la version finale
        DB::statement("ALTER TABLE `stocks` 
            MODIFY `type_mouvement` ENUM('IN','OUT','ADJ') NOT NULL DEFAULT 'IN'");
    }

    public function down(): void
    {
        // rollback : remettre entrée/sortie
        DB::statement("ALTER TABLE `stocks` 
            MODIFY `type_mouvement` ENUM('IN','OUT','ADJ','entrée','sortie') NOT NULL DEFAULT 'IN'");

        DB::table('stocks')->where('type_mouvement', 'IN')->update(['type_mouvement' => 'entrée']);
        DB::table('stocks')->where('type_mouvement', 'OUT')->update(['type_mouvement' => 'sortie']);

        DB::statement("ALTER TABLE `stocks` 
            MODIFY `type_mouvement` ENUM('entrée','sortie') NOT NULL DEFAULT 'entrée'");
    }
};
