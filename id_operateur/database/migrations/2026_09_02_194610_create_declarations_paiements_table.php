<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('declarations_paiements', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('personne_id');
            $table->unsignedBigInteger('taxe_id');
            $table->unsignedBigInteger('bien_immobilier_id')->nullable();
            $table->unsignedBigInteger('vehicule_id')->nullable();
            $table->unsignedBigInteger('permis_id')->nullable();
            $table->year('exercice');
            $table->date('periode_debut');
            $table->date('periode_fin');
            $table->decimal('montant_base', 20, 2);
            $table->decimal('montant_taxe', 20, 2);
            $table->decimal('penalites', 20, 2)->default(0.00);
            $table->decimal('montant_total', 20, 2);
            $table->date('date_limite_paiement');
            $table->date('date_paiement')->nullable();
            $table->enum('statut', ['en_attente', 'paye', 'en_retard', 'conteste', 'annule', 'exonere'])->default('en_attente');
            $table->string('reference_paiement', 100)->nullable();
            $table->string('justificatif', 255)->nullable();
            $table->text('observations')->nullable();
            $table->timestamps();

            $table->index('personne_id');
            $table->index('taxe_id');
            $table->index('statut');
            $table->index('exercice');
            $table->index('bien_immobilier_id');
            $table->index('vehicule_id');
            $table->index('permis_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('declarations_paiements');
    }
};