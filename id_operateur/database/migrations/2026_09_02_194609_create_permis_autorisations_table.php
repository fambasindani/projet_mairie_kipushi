<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('permis_autorisations', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('personne_id');
            $table->enum('type_permis', ['patente', 'construire', 'occupation_sol', 'etalage', 'exploitation', 'transport', 'autre']);
            $table->string('numero', 50);
            $table->date('date_delivrance');
            $table->date('date_expiration')->nullable();
            $table->boolean('est_valide')->default(true);
            $table->boolean('est_renouvele')->default(false);
            $table->string('document_scan', 255)->nullable();
            $table->timestamps();

            $table->unique(['type_permis', 'numero']);
            $table->index('personne_id');
            $table->index('est_valide');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('permis_autorisations');
    }
};