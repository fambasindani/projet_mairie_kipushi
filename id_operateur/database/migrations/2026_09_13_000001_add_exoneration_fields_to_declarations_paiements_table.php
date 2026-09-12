<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('declarations_paiements', function (Blueprint $table) {
            $table->text('motif_exoneration')->nullable()->after('motif_annulation');
            $table->string('justificatif_exoneration', 255)->nullable()->after('motif_exoneration');
        });
    }

    public function down(): void
    {
        Schema::table('declarations_paiements', function (Blueprint $table) {
            $table->dropColumn(['motif_exoneration', 'justificatif_exoneration']);
        });
    }
};
