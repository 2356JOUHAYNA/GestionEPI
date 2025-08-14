<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddManagerIdToEmployesTable extends Migration
{
    public function up()
    {
        Schema::table('employes', function (Blueprint $table) {
            if (!Schema::hasColumn('employes', 'manager_id')) {
                // Ajoute la colonne à la fin de la table (sans after())
                $table->foreignId('manager_id')
                    ->nullable()
                    ->constrained('managers')
                    ->onDelete('set null');
            }
        });
    }

    public function down()
    {
        Schema::table('employes', function (Blueprint $table) {
            if (Schema::hasColumn('employes', 'manager_id')) {
                $table->dropForeign(['manager_id']);
                $table->dropColumn('manager_id');
            }
        });
    }
}
