<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('personnes', function (Blueprint $table) {
            $table->id();
            $table->enum('type', ['physique', 'morale']);
            $table->string('nom', 100)->nullable();
            $table->string('prenom', 100)->nullable();
            $table->date('date_naissance')->nullable();
            $table->string('lieu_naissance', 100)->nullable();
            $table->string('nationalite', 50)->nullable();
            $table->enum('sexe', ['M', 'F'])->nullable();
            $table->string('cni_numero', 50)->nullable();
            $table->string('denomination_sociale', 255)->nullable();
            $table->string('forme_juridique', 50)->nullable();
            $table->date('date_creation')->nullable();
            $table->text('adresse')->nullable();
            $table->string('quartier', 100)->nullable();
            $table->string('commune', 100)->nullable();
            $table->string('ville', 100)->nullable();
            $table->string('province', 100)->nullable();
            $table->string('telephone', 30)->nullable();
            $table->string('telephone_2', 30)->nullable();
            $table->string('email', 100)->nullable();
            $table->string('site_web', 255)->nullable();
            $table->boolean('est_actif')->default(true);
            $table->boolean('est_formalise')->default(false);
            $table->dateTime('date_formalisation')->nullable();
            $table->decimal('latitude', 10, 8)->nullable();
            $table->decimal('longitude', 11, 8)->nullable();
            $table->string('avatar', 255)->nullable()->comment('Chemin de la photo de profil');
            $table->timestamps();

            $table->index(['nom', 'prenom']);
            $table->index('denomination_sociale');
            $table->index('commune');
            $table->index('est_actif');
            $table->index('type');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('personnes');
    }
};