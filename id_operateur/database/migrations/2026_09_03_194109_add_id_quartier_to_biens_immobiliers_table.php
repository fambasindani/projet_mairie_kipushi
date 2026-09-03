<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('biens_immobiliers', function (Blueprint $table) {
            $table->unsignedBigInteger('id_quartier')->nullable()->after('commune');
            $table->foreign('id_quartier')->references('id')->on('quartiers')->nullOnDelete()->restrictOnUpdate();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('biens_immobiliers', function (Blueprint $table) {
            $table->dropForeign(['id_quartier']);
            $table->dropColumn('id_quartier');
        });
    }
};
