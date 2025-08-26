<?php
// database/migrations/xxxx_xx_xx_create_affectations_table.php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
{
    if (Schema::hasTable('affectations')) {
        // La table existe déjà -> on ne touche à rien
        return;
    }

    Schema::create('affectations', function (Blueprint $table) {
        $table->id();
        $table->unsignedBigInteger('employe_id');
        $table->date('date');
        $table->string('commentaire')->nullable();
        $table->timestamps();

        $table->foreign('employe_id')->references('id')->on('employes')->onDelete('cascade');
    });
}

    public function down(): void {
        Schema::dropIfExists('affectations');
    }
};
