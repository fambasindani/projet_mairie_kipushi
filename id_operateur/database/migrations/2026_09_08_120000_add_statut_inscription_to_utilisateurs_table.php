<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('utilisateurs', function (Blueprint $table) {
            $table->enum('statut_inscription', ['en_attente', 'approuve', 'rejete'])->default('approuve')->after('email');
            $table->text('motif_rejet')->nullable()->after('statut_inscription');
            $table->date('date_inscription')->nullable()->after('motif_rejet');
        });
    }

    public function down(): void
    {
        Schema::table('utilisateurs', function (Blueprint $table) {
            $table->dropColumn(['statut_inscription', 'motif_rejet', 'date_inscription']);
        });
    }
};
