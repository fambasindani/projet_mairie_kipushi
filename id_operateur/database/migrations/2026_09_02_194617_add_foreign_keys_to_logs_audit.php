<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('logs_audit', function (Blueprint $table) {
            $table->foreign('utilisateur_id')
                  ->references('id')
                  ->on('utilisateurs')
                  ->onDelete('set null')
                  ->onUpdate('restrict');
        });
    }

    public function down(): void
    {
        Schema::table('logs_audit', function (Blueprint $table) {
            $table->dropForeign(['utilisateur_id']);
        });
    }
};