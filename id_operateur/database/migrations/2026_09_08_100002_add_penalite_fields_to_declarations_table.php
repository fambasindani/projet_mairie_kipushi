<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('declarations_paiements', function (Blueprint $table) {
            $table->date('date_dernier_calcul_penalites')->nullable()->after('observations');
            $table->integer('nombre_jours_retard')->default(0)->after('date_dernier_calcul_penalites');
            $table->decimal('majoration_retard', 20, 2)->default(0)->after('nombre_jours_retard');
            $table->decimal('interet_retard', 20, 2)->default(0)->after('majoration_retard');
            $table->boolean('mise_en_demeure_envoyee')->default(false)->after('interet_retard');
            $table->date('date_mise_en_demeure')->nullable()->after('mise_en_demeure_envoyee');
        });
    }

    public function down(): void
    {
        Schema::table('declarations_paiements', function (Blueprint $table) {
            $table->dropColumn([
                'date_dernier_calcul_penalites',
                'nombre_jours_retard',
                'majoration_retard',
                'interet_retard',
                'mise_en_demeure_envoyee',
                'date_mise_en_demeure',
            ]);
        });
    }
};
