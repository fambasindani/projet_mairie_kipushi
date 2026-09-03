<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('documents', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('personne_id');
            $table->enum('type_document', ['CNI', 'PASSEPORT', 'STATUTS', 'RCCM', 'PATENTE', 'QUITTANCE', 'AVATAR', 'AUTRE']);
            $table->string('numero', 100)->nullable();
            $table->string('fichier', 255);
            $table->date('date_expiration')->nullable();
            $table->boolean('est_valide')->default(true);
            $table->timestamps();

            $table->index('personne_id');
            $table->index('type_document');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('documents');
    }
};