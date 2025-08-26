<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('employes', function (Blueprint $table) {
            // rendre 'prenom' facultatif
            $table->string('prenom', 150)->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('employes', function (Blueprint $table) {
            // revert: NOT NULL + valeur par défaut vide
            $table->string('prenom', 150)->default('')->nullable(false)->change();
        });
    }
};
