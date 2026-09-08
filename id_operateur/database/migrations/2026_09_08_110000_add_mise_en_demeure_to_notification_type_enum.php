<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("ALTER TABLE notifications MODIFY COLUMN type_notification ENUM('paiement_echu','renouvellement_permis','controle_prochain','information','mise_en_demeure') NOT NULL DEFAULT 'information'");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE notifications MODIFY COLUMN type_notification ENUM('paiement_echu','renouvellement_permis','controle_prochain','information') NOT NULL DEFAULT 'information'");
    }
};
