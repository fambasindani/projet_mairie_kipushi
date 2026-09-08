<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('mises_en_demeure', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('declaration_paiement_id');
            $table->date('date_emission');
            $table->date('date_echeance');
            $table->decimal('montant_restant', 20, 2);
            $table->text('motif')->nullable();
            $table->enum('statut', ['en_cours', 'honoree', 'passee_en_force'])->default('en_cours');
            $table->timestamps();

            $table->index('declaration_paiement_id');
            $table->index('statut');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('mises_en_demeure');
    }
};
