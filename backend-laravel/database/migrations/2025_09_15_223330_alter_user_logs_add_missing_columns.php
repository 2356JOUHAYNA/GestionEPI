<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('user_logs', function (Blueprint $table) {
            if (!Schema::hasColumn('user_logs', 'email')) {
                $table->string('email')->nullable()->after('user_id');
            }
            if (!Schema::hasColumn('user_logs', 'action')) {
                $table->enum('action', ['login','logout','register'])->default('login')->after('email');
            }
            if (!Schema::hasColumn('user_logs', 'success')) {
                $table->boolean('success')->default(true)->after('action');
            }
            if (!Schema::hasColumn('user_logs', 'ip')) {
                $table->string('ip', 64)->nullable()->after('success');
            }
            if (!Schema::hasColumn('user_logs', 'user_agent')) {
                $table->string('user_agent', 512)->nullable()->after('ip');
            }
            if (!Schema::hasColumn('user_logs', 'meta')) {
                // Si votre MySQL < 5.7 ne supporte pas JSON, remplacez par:
                // $table->longText('meta')->nullable();
                $table->json('meta')->nullable()->after('user_agent');
            }
            if (!Schema::hasColumn('user_logs', 'created_at')) {
                $table->timestamps();
            }
        });
    }

    public function down(): void
    {
        // on ne supprime rien pour ne pas perdre l'historique
    }
};
