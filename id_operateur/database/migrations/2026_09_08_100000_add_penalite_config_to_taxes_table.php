<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('taxes', function (Blueprint $table) {
            $table->decimal('taux_majoration_retard', 5, 2)->default(25)->after('taux');
            $table->decimal('taux_interet_mensuel', 5, 2)->default(2)->after('taux_majoration_retard');
            $table->integer('delai_grace_jours')->default(0)->after('taux_interet_mensuel');
            $table->decimal('taux_majoration_apres_mise_en_demeure', 5, 2)->default(100)->after('delai_grace_jours');
        });
    }

    public function down(): void
    {
        Schema::table('taxes', function (Blueprint $table) {
            $table->dropColumn([
                'taux_majoration_retard',
                'taux_interet_mensuel',
                'delai_grace_jours',
                'taux_majoration_apres_mise_en_demeure',
            ]);
        });
    }
};
