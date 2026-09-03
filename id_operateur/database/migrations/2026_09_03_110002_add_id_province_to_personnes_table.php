<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('personnes', function (Blueprint $table) {
            $table->unsignedBigInteger('id_province')->nullable()->after('id_quartier');
            $table->foreign('id_province')->references('id')->on('provinces')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('personnes', function (Blueprint $table) {
            $table->dropForeign(['id_province']);
            $table->dropColumn('id_province');
        });
    }
};
