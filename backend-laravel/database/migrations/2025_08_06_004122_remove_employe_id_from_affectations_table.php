<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up()
    {
        Schema::table('affectations', function (Blueprint $table) {
            // Supprimer la contrainte de clé étrangère
            $table->dropForeign(['employe_id']);

            // Ensuite supprimer la colonne
            $table->dropColumn('employe_id');
        });
    }

    public function down()
    {
        Schema::table('affectations', function (Blueprint $table) {
            $table->unsignedBigInteger('employe_id');

            // Si tu veux restaurer la contrainte foreign key
            $table->foreign('employe_id')->references('id')->on('employes')->onDelete('cascade');
        });
    }
};
