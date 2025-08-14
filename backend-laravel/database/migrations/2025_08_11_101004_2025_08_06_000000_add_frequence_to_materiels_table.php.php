<?php
// database/migrations/2025_08_06_000000_add_frequence_to_materiels_table.php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('materiels', function (Blueprint $table) {
            // string suffit; si tu préfères enum: ->enum('frequence', ['mensuelle','trimestrielle','annuelle','ponctuelle'])
            $table->string('frequence')->default('ponctuelle')->after('nom');
        });
    }

    public function down(): void
    {
        Schema::table('materiels', function (Blueprint $table) {
            $table->dropColumn('frequence');
        });
    }
};
