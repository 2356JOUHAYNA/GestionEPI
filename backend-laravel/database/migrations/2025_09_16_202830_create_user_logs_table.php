<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
   public function up()
{
    Schema::create('user_logs', function (Blueprint $table) {
        $table->id();
        $table->foreignId('user_id')->nullable()->constrained('users')->onDelete('cascade');
        $table->string('email')->nullable();
        $table->string('action');       // ex: login, logout, register
        $table->boolean('success')->default(true);
        $table->string('ip')->nullable();
        $table->string('user_agent')->nullable();
        $table->json('meta')->nullable();
        $table->timestamps();
    });
}

public function down()
{
    Schema::dropIfExists('user_logs');
}

};
