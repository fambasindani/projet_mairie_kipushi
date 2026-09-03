<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            // 1. Tables indépendantes
            CommuneSeeder::class,
            ActiviteEconomiqueSeeder::class,
            
            // 2. Rôles et permissions (IMPORTANT: avant les utilisateurs)
            RoleSeeder::class,
            PermissionSeeder::class,
            RolesPermissionsSeeder::class,
            
            // 3. Personnes
            PersonneSeeder::class,
            
            // 4. Utilisateurs (dépend des rôles et des personnes)
            UtilisateurSeeder::class,
            
            // 5. Autres
            TaxeSeeder::class,
            ParametreSeeder::class,
        ]);
    }
}