<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('identifiants_officiels', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('personne_id');
            $table->enum('type_identifiant', ['RCCM', 'IDNAT', 'NUMERO_IMPOT', 'NIF', 'CNSS', 'ONEM', 'PASSEPORT', 'PERMIS_CONDURE']);
            $table->string('valeur', 50);
            $table->string('province_delivrance', 100)->nullable();
            $table->date('date_delivrance')->nullable();
            $table->date('date_expiration')->nullable();
            $table->boolean('est_actif')->default(true);
            $table->timestamps();

            $table->unique(['type_identifiant', 'valeur']);
            $table->index('personne_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('identifiants_officiels');
    }
};