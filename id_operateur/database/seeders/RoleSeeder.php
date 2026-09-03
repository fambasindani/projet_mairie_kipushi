<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class RoleSeeder extends Seeder
{
    public function run(): void
    {
        $roles = [
            ['nom' => 'Administrateur', 'description' => 'Accès total au système - Gestion complète'],
            ['nom' => 'Agent_Mairie', 'description' => 'Gestion des opérateurs et des taxes locales'],
            ['nom' => 'Agent_Recensement', 'description' => 'Recensement sur le terrain et enregistrement des opérateurs'],
            ['nom' => 'Agent_Recouvrement', 'description' => 'Gestion des paiements et recouvrement des taxes'],
            ['nom' => 'Operateur', 'description' => 'Consultation de son propre dossier et paiement en ligne'],
            ['nom' => 'Auditeur', 'description' => 'Consultation des données et audit sans modification'],
        ];

        DB::table('roles')->insert($roles);
    }
}