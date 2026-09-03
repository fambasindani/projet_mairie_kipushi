<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('logs_audit', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('utilisateur_id')->nullable();
            $table->string('action', 50);
            $table->string('table_cible', 50)->nullable();
            $table->unsignedBigInteger('enregistrement_id')->nullable();
            $table->json('anciennes_valeurs')->nullable();
            $table->json('nouvelles_valeurs')->nullable();
            $table->string('adresse_ip', 45)->nullable();
            $table->string('user_agent', 255)->nullable();
            $table->timestamps();

            $table->index('utilisateur_id');
            $table->index('action');
            $table->index('table_cible');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('logs_audit');
    }
};