<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('quartiers', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('commune_id');
            $table->string('nom', 100);
            $table->string('code', 10);
            $table->boolean('est_actif')->default(true);
            $table->timestamps();

            $table->unique(['commune_id', 'code']);
            $table->index('commune_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('quartiers');
    }
};