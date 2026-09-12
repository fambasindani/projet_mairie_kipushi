<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('recus_perception', function (Blueprint $table) {
            $table->boolean('valide')->default(false)->after('percepteur_id');
        });
    }

    public function down(): void
    {
        Schema::table('recus_perception', function (Blueprint $table) {
            $table->dropColumn('valide');
        });
    }
};
