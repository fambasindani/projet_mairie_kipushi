<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('notifications', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('personne_id');
            $table->enum('type_notification', ['paiement_echu', 'renouvellement_permis', 'controle_prochain', 'information']);
            $table->string('sujet', 255);
            $table->text('message');
            $table->boolean('est_lue')->default(false);
            $table->dateTime('date_envoi')->default(now());
            $table->dateTime('date_lecture')->nullable();
            $table->string('lien_action', 255)->nullable();
            $table->timestamps();

            $table->index('personne_id');
            $table->index('est_lue');
            $table->index('type_notification');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('notifications');
    }
};