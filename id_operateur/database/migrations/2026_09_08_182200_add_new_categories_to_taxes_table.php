<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        DB::statement("ALTER TABLE taxes MODIFY COLUMN categorie ENUM('patente','foncier','revenus_locatifs','personnel_minimum','vehicule','permis_construire','etalage','peage_urbain','pont_bascule','chargement','dechargement','autre') DEFAULT 'autre'");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE taxes MODIFY COLUMN categorie ENUM('patente','foncier','revenus_locatifs','personnel_minimum','vehicule','permis_construire','etalage','autre') DEFAULT 'autre'");
    }
};
