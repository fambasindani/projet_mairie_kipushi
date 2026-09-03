<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('quartiers', function (Blueprint $table) {
            $table->foreign('commune_id')
                  ->references('id')
                  ->on('communes')
                  ->onDelete('cascade')
                  ->onUpdate('restrict');
        });
    }

    public function down(): void
    {
        Schema::table('quartiers', function (Blueprint $table) {
            $table->dropForeign(['commune_id']);
        });
    }
};