<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('utilisateurs', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('personne_id')->unique();
            $table->string('nom_utilisateur', 50)->unique();
            $table->string('mot_de_passe_hash', 255);
            $table->string('email', 100)->unique();
            $table->boolean('est_actif')->default(true);
            $table->boolean('est_verrouille')->default(false);
            $table->tinyInteger('tentatives_connexion')->unsigned()->default(0);
            $table->dateTime('derniere_connexion')->nullable();
            $table->date('date_expiration_mot_de_passe')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('utilisateurs');
    }
};