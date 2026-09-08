<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ActiviteEconomiqueSeeder extends Seeder
{
    public function run(): void
    {
        $activites = [
            ['code' => 'COM001', 'nom' => 'Commerce général', 'secteur' => 'Commerce', 'description' => 'Achat et revente de marchandises', 'est_actif' => true],
            ['code' => 'COM002', 'nom' => 'Commerce de détail', 'secteur' => 'Commerce', 'description' => 'Vente au détail de produits divers', 'est_actif' => true],
            ['code' => 'COM003', 'nom' => 'Commerce de gros', 'secteur' => 'Commerce', 'description' => 'Vente en gros aux revendeurs', 'est_actif' => true],
            ['code' => 'TRA001', 'nom' => 'Transport de passagers', 'secteur' => 'Transport', 'description' => 'Transport urbain et interurbain', 'est_actif' => true],
            ['code' => 'TRA002', 'nom' => 'Transport de marchandises', 'secteur' => 'Transport', 'description' => 'Fret et logistique', 'est_actif' => true],
            ['code' => 'TRA003', 'nom' => 'Taxi / VTC', 'secteur' => 'Transport', 'description' => 'Service de transport de personnes', 'est_actif' => true],
            ['code' => 'AGR001', 'nom' => 'Agriculture', 'secteur' => 'Agriculture', 'description' => 'Culture vivrière et maraîchère', 'est_actif' => true],
            ['code' => 'AGR002', 'nom' => 'Élevage', 'secteur' => 'Agriculture', 'description' => 'Élevage de bétail', 'est_actif' => true],
            ['code' => 'AGR003', 'nom' => 'Pêche', 'secteur' => 'Agriculture', 'description' => 'Pêche artisanale et industrielle', 'est_actif' => true],
            ['code' => 'IND001', 'nom' => 'Artisanat', 'secteur' => 'Industrie', 'description' => 'Fabrication artisanale de produits', 'est_actif' => true],
            ['code' => 'IND002', 'nom' => 'Construction', 'secteur' => 'Industrie', 'description' => 'Bâtiment et travaux publics', 'est_actif' => true],
            ['code' => 'IND003', 'nom' => 'Industrie alimentaire', 'secteur' => 'Industrie', 'description' => 'Transformation de produits alimentaires', 'est_actif' => true],
            ['code' => 'SER001', 'nom' => 'Restauration', 'secteur' => 'Services', 'description' => 'Restaurant, bar, café', 'est_actif' => true],
            ['code' => 'SER002', 'nom' => 'Hébergement', 'secteur' => 'Services', 'description' => 'Hôtel, auberge, location', 'est_actif' => true],
            ['code' => 'SER003', 'nom' => 'Salon de coiffure', 'secteur' => 'Services', 'description' => 'Coiffure et soins esthétiques', 'est_actif' => true],
            ['code' => 'SER004', 'nom' => 'Couture / Tailleur', 'secteur' => 'Services', 'description' => 'Confection de vêtements', 'est_actif' => true],
            ['code' => 'SER005', 'nom' => 'Clinique / Pharmacie', 'secteur' => 'Santé', 'description' => 'Services de santé', 'est_actif' => true],
            ['code' => 'SER006', 'nom' => 'Boulangerie / Pâtisserie', 'secteur' => 'Alimentation', 'description' => 'Fabrication de pain et pâtisseries', 'est_actif' => true],
            ['code' => 'SER007', 'nom' => 'Boucherie', 'secteur' => 'Alimentation', 'description' => 'Découpe et vente de viande', 'est_actif' => true],
            ['code' => 'SER008', 'nom' => 'Poissonnerie', 'secteur' => 'Alimentation', 'description' => 'Vente de poisson', 'est_actif' => true],
            ['code' => 'SER009', 'nom' => 'Imprimerie', 'secteur' => 'Services', 'description' => 'Impression et reliure', 'est_actif' => true],
            ['code' => 'SER010', 'nom' => 'Cybercafé', 'secteur' => 'Services', 'description' => 'Accès internet et impression', 'est_actif' => true],
            ['code' => 'SER011', 'nom' => 'Auto-école', 'secteur' => 'Services', 'description' => 'Formation à la conduite', 'est_actif' => true],
            ['code' => 'SER012', 'nom' => 'Immobilier', 'secteur' => 'Services', 'description' => 'Achat, vente et location de biens', 'est_actif' => true],
            ['code' => 'FIN001', 'nom' => 'Banque', 'secteur' => 'Finance', 'description' => 'Services bancaires', 'est_actif' => true],
            ['code' => 'FIN002', 'nom' => 'Microfinance', 'secteur' => 'Finance', 'description' => 'Crédit et épargne', 'est_actif' => true],
            ['code' => 'FIN003', 'nom' => 'Assurance', 'secteur' => 'Finance', 'description' => 'Services d\'assurance', 'est_actif' => true],
            ['code' => 'TEC001', 'nom' => 'Télécommunications', 'secteur' => 'Technologie', 'description' => 'Services de télécommunication', 'est_actif' => true],
            ['code' => 'TEC002', 'nom' => 'Informatique', 'secteur' => 'Technologie', 'description' => 'Développement et maintenance informatique', 'est_actif' => true],
            ['code' => 'TEC003', 'nom' => 'Électricité / Plomberie', 'secteur' => 'Technique', 'description' => 'Installation et maintenance', 'est_actif' => true],
            ['code' => 'AUT001', 'nom' => 'Autre', 'secteur' => 'Autre', 'description' => 'Activité non classée', 'est_actif' => true],
        ];

        foreach ($activites as $activite) {
            DB::table('activites_economiques')->updateOrInsert(
                ['code' => $activite['code']],
                array_merge($activite, ['created_at' => now(), 'updated_at' => now()])
            );
        }
    }
}
