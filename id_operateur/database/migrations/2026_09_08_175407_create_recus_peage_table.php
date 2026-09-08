<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('recus_peage', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('taxe_id');
            $table->unsignedBigInteger('personne_id')->nullable();
            $table->unsignedBigInteger('percepteur_id')->nullable();
            $table->string('numero', 50)->unique();
            $table->date('date_emission');
            $table->time('heure_emission')->nullable();
            $table->string('categorie_vehicule', 50)->nullable();
            $table->string('plaque_immatriculation', 20)->nullable();
            $table->decimal('montant', 20, 2);
            $table->enum('trajet', ['aller', 'retour', 'aller_retour'])->default('aller');
            $table->string('chauffeur_nom', 100)->nullable();
            $table->text('observations')->nullable();
            $table->timestamps();

            $table->index('taxe_id');
            $table->index('personne_id');
            $table->index('percepteur_id');
            $table->index('date_emission');
            $table->index('numero');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('recus_peage');
    }
};
