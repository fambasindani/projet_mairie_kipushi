<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('declarations_paiements', function (Blueprint $table) {
            $table->foreign('personne_id')
                  ->references('id')
                  ->on('personnes')
                  ->onDelete('cascade')
                  ->onUpdate('restrict');

            $table->foreign('taxe_id')
                  ->references('id')
                  ->on('taxes')
                  ->onDelete('cascade')
                  ->onUpdate('restrict');

            $table->foreign('bien_immobilier_id')
                  ->references('id')
                  ->on('biens_immobiliers')
                  ->onDelete('set null')
                  ->onUpdate('restrict');

            $table->foreign('vehicule_id')
                  ->references('id')
                  ->on('vehicules')
                  ->onDelete('set null')
                  ->onUpdate('restrict');

            $table->foreign('permis_id')
                  ->references('id')
                  ->on('permis_autorisations')
                  ->onDelete('set null')
                  ->onUpdate('restrict');
        });
    }

    public function down(): void
    {
        Schema::table('declarations_paiements', function (Blueprint $table) {
            $table->dropForeign(['personne_id']);
            $table->dropForeign(['taxe_id']);
            $table->dropForeign(['bien_immobilier_id']);
            $table->dropForeign(['vehicule_id']);
            $table->dropForeign(['permis_id']);
        });
    }
};