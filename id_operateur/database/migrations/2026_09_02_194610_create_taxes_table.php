<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('taxes', function (Blueprint $table) {
            $table->id();
            $table->string('code', 20)->unique();
            $table->string('nom', 255);
            $table->enum('categorie', ['patente', 'foncier', 'revenus_locatifs', 'personnel_minimum', 'vehicule', 'permis_construire', 'etalage', 'autre'])->default('autre');
            $table->text('description')->nullable();
            $table->decimal('taux', 10, 4)->nullable();
            $table->enum('unite', ['pourcentage', 'montant_fixe', 'par_unite'])->default('montant_fixe');
            $table->enum('periodicite', ['mensuelle', 'trimestrielle', 'semestrielle', 'annuelle', 'evenementielle'])->default('annuelle');
            $table->json('bareme')->nullable();
            $table->boolean('est_actif')->default(true);
            $table->boolean('est_locale')->default(true);
            $table->timestamps();

            $table->index('categorie');
            $table->index('est_actif');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('taxes');
    }
};