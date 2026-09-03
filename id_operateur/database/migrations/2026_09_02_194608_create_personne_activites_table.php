<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('personne_activites', function (Blueprint $table) {
            $table->unsignedBigInteger('personne_id');
            $table->unsignedBigInteger('activite_id');
            $table->boolean('est_principale')->default(false);
            $table->date('date_debut')->nullable(); // ← Ajouter nullable
            $table->date('date_fin')->nullable();
            $table->timestamps();

            $table->primary(['personne_id', 'activite_id']);
            $table->index('activite_id');

            // Ajouter les contraintes de clés étrangères
            $table->foreign('personne_id')
                  ->references('id')
                  ->on('personnes')
                  ->onDelete('cascade');

            $table->foreign('activite_id')
                  ->references('id')
                  ->on('activites_economiques')
                  ->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('personne_activites');
    }
};