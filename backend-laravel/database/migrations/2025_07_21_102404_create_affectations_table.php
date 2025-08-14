<?php
// database/migrations/xxxx_xx_xx_create_affectations_table.php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('affectations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employe_id')->constrained('employes')->onDelete('cascade');
            $table->date('date');
            $table->string('commentaire')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void {
        Schema::dropIfExists('affectations');
    }
};
