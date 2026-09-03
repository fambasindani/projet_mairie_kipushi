<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('personne_activites', function (Blueprint $table) {
            // Modifier la colonne date_debut pour accepter NULL
            $table->date('date_debut')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('personne_activites', function (Blueprint $table) {
            $table->date('date_debut')->nullable(false)->change();
        });
    }
};