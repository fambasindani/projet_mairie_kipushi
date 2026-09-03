<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('personnes', function (Blueprint $table) {
            $table->unsignedBigInteger('id_ville')->nullable()->after('id_province');
            $table->foreign('id_ville')->references('id')->on('villes')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('personnes', function (Blueprint $table) {
            $table->dropForeign(['id_ville']);
            $table->dropColumn('id_ville');
        });
    }
};
