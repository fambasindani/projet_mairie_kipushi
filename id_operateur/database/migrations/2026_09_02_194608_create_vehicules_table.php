<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('vehicules', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('proprietaire_id');
            $table->string('plaque_immatriculation', 20)->unique();
            $table->string('marque', 50)->nullable();
            $table->string('modele', 50)->nullable();
            $table->year('annee_fabrication')->nullable();
            $table->string('couleur', 30)->nullable();
            $table->enum('type_vehicule', ['voiture', 'moto', 'poids_lourd', 'bus', 'minibus', 'taxi', 'autre']);
            $table->tinyInteger('nombre_places')->nullable();
            $table->decimal('poids', 10, 2)->nullable();
            $table->boolean('est_actif')->default(true);
            $table->timestamps();

            $table->index('proprietaire_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('vehicules');
    }
};