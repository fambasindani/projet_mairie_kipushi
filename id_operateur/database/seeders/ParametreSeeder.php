<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class ParametreSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $parametres = [
            ['cle' => 'app_name', 'valeur' => 'GS Opérateur', 'description' => 'Nom de l\'application', 'est_modifiable' => true],
            ['cle' => 'devise_defaut', 'valeur' => 'CDF', 'description' => 'Devise par défaut (CDF ou USD)', 'est_modifiable' => false],
            ['cle' => 'taux_penalty_retard', 'valeur' => '5', 'description' => 'Taux de pénalité en % pour retard de paiement', 'est_modifiable' => true],
            ['cle' => 'delai_paiement_jours', 'valeur' => '30', 'description' => 'Délai de paiement en jours après déclaration', 'est_modifiable' => true],
            ['cle' => 'max_tentatives_connexion', 'valeur' => '5', 'description' => 'Nombre max de tentatives avant verrouillage', 'est_modifiable' => true],
            ['cle' => 'duree_session_heures', 'valeur' => '24', 'description' => 'Durée de session en heures', 'est_modifiable' => true],
            ['cle' => 'email_notifications', 'valeur' => 'true', 'description' => 'Activer les notifications par email', 'est_modifiable' => true],
            ['cle' => 'logo_url', 'valeur' => '/logo.png', 'description' => 'URL du logo de l\'application', 'est_modifiable' => true],
            ['cle' => 'version_api', 'valeur' => '1.0.0', 'description' => 'Version actuelle de l\'API', 'est_modifiable' => false],
            ['cle' => 'maintenance_mode', 'valeur' => 'false', 'description' => 'Mode maintenance activé/désactivé', 'est_modifiable' => false],
        ];

        foreach ($parametres as $p) {
            \App\Models\Parametre::updateOrCreate(
                ['cle' => $p['cle']],
                $p
            );
        }
    }
}
