<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('biens_immobiliers', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('proprietaire_id');
            $table->string('adresse', 255);
            $table->string('quartier', 100)->nullable();
            $table->string('commune', 100)->nullable();
            $table->string('parcelle_id', 50)->nullable();
            $table->enum('type_bien', ['terrain', 'maison', 'appartement', 'immeuble', 'local_commercial', 'entrepot', 'autre']);
            $table->decimal('superficie', 10, 2)->nullable();
            $table->decimal('valeur_locative', 20, 2)->nullable();
            $table->decimal('valeur_venale', 20, 2)->nullable();
            $table->tinyInteger('classement')->nullable()->comment('1er, 2e, 3e ou 4e rang');
            $table->boolean('est_actif')->default(true);
            $table->timestamps();

            $table->index('proprietaire_id');
            $table->index('commune');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('biens_immobiliers');
    }
};