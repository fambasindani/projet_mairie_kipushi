<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('factures', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('declaration_paiement_id')->unique();
            $table->string('numero_facture', 30)->unique();
            $table->dateTime('date_emission')->default(now());
            $table->decimal('montant_ht', 20, 2);
            $table->decimal('montant_tva', 20, 2)->default(0.00);
            $table->decimal('montant_total', 20, 2);
            $table->enum('devise', ['CDF', 'USD'])->default('CDF');
            $table->string('chemin_pdf', 255)->nullable();
            $table->enum('statut', ['emise', 'payee', 'annulee'])->default('emise');
            $table->text('observations')->nullable();
            $table->timestamps();

            $table->index('declaration_paiement_id');
            $table->index('numero_facture');
            $table->index('statut');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('factures');
    }
};