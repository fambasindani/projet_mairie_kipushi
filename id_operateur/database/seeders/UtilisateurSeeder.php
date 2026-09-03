<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class UtilisateurSeeder extends Seeder
{
    public function run(): void
    {
        // VÉRIFIER SI LES RÔLES EXISTENT
        $rolesCount = DB::table('roles')->count();
        if ($rolesCount == 0) {
            $this->command->error('❌ Aucun rôle trouvé !');
            $this->command->info('   Exécutez d\'abord: php artisan db:seed --class=RoleSeeder');
            return;
        }

        // Récupérer l'ID de la personne admin
        $personneAdmin = DB::table('personnes')
            ->where('email', 'pierrepapy@gmail.com')
            ->first();

        if (!$personneAdmin) {
            $this->command->error('❌ Personne admin non trouvée !');
            $this->command->info('   Exécutez d\'abord: php artisan db:seed --class=PersonneSeeder');
            return;
        }

        // Récupérer l'ID du rôle Administrateur
        $roleAdmin = DB::table('roles')
            ->where('nom', 'Administrateur')
            ->first();

        if (!$roleAdmin) {
            $this->command->error('❌ Rôle Administrateur non trouvé !');
            $this->command->info('   Vérifiez que les rôles ont été créés correctement.');
            return;
        }

        // Vérifier si l'utilisateur existe déjà
        $existingUser = DB::table('utilisateurs')
            ->where('email', 'pierrepapy@gmail.com')
            ->first();

        if (!$existingUser) {
            // Créer l'utilisateur admin
            $utilisateurId = DB::table('utilisateurs')->insertGetId([
                'personne_id' => $personneAdmin->id,
                'nom_utilisateur' => 'admin',
                'mot_de_passe_hash' => Hash::make('12345678'),
                'email' => 'pierrepapy@gmail.com',
                'est_actif' => true,
                'est_verrouille' => false,
                'tentatives_connexion' => 0,
                'derniere_connexion' => null,
                'date_expiration_mot_de_passe' => null,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            // Assigner le rôle Administrateur
            DB::table('utilisateurs_roles')->insert([
                'utilisateur_id' => $utilisateurId,
                'role_id' => $roleAdmin->id,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $this->command->info('✅ Administrateur créé avec succès !');
            $this->command->info('   Email: pierrepapy@gmail.com');
            $this->command->info('   Mot de passe: 12345678');
        } else {
            $this->command->info('ℹ️  L\'administrateur existe déjà.');
        }

        // ============================================================
        // AGENT RECENSEMENT
        // ============================================================
        
        $personneTest = DB::table('personnes')
            ->where('email', 'jean.dupont@email.com')
            ->first();

        $roleRecensement = DB::table('roles')
            ->where('nom', 'Agent_Recensement')
            ->first();

        if ($personneTest && $roleRecensement) {
            $existingTestUser = DB::table('utilisateurs')
                ->where('email', 'jean.dupont@email.com')
                ->first();

            if (!$existingTestUser) {
                $utilisateurTestId = DB::table('utilisateurs')->insertGetId([
                    'personne_id' => $personneTest->id,
                    'nom_utilisateur' => 'jean.dupont',
                    'mot_de_passe_hash' => Hash::make('password123'),
                    'email' => 'jean.dupont@email.com',
                    'est_actif' => true,
                    'est_verrouille' => false,
                    'tentatives_connexion' => 0,
                    'derniere_connexion' => null,
                    'date_expiration_mot_de_passe' => null,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);

                DB::table('utilisateurs_roles')->insert([
                    'utilisateur_id' => $utilisateurTestId,
                    'role_id' => $roleRecensement->id,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);

                $this->command->info('✅ Agent Recensement créé avec succès !');
                $this->command->info('   Email: jean.dupont@email.com');
                $this->command->info('   Mot de passe: password123');
            } else {
                $this->command->info('ℹ️  L\'Agent Recensement existe déjà.');
            }
        }

        // ============================================================
        // OPERATEUR
        // ============================================================
        
        $personneOperateur = DB::table('personnes')
            ->where('email', 'marie.mbala@email.com')
            ->first();

        $roleOperateur = DB::table('roles')
            ->where('nom', 'Operateur')
            ->first();

        if ($personneOperateur && $roleOperateur) {
            $existingOperateurUser = DB::table('utilisateurs')
                ->where('email', 'marie.mbala@email.com')
                ->first();

            if (!$existingOperateurUser) {
                $utilisateurOperateurId = DB::table('utilisateurs')->insertGetId([
                    'personne_id' => $personneOperateur->id,
                    'nom_utilisateur' => 'marie.mbala',
                    'mot_de_passe_hash' => Hash::make('operator123'),
                    'email' => 'marie.mbala@email.com',
                    'est_actif' => true,
                    'est_verrouille' => false,
                    'tentatives_connexion' => 0,
                    'derniere_connexion' => null,
                    'date_expiration_mot_de_passe' => null,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);

                DB::table('utilisateurs_roles')->insert([
                    'utilisateur_id' => $utilisateurOperateurId,
                    'role_id' => $roleOperateur->id,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);

                $this->command->info('✅ Opérateur créé avec succès !');
                $this->command->info('   Email: marie.mbala@email.com');
                $this->command->info('   Mot de passe: operator123');
            } else {
                $this->command->info('ℹ️  L\'Opérateur existe déjà.');
            }
        }

        // ============================================================
        // RÉSUMÉ
        // ============================================================
        $this->command->newLine();
        $this->command->info('📊 RÉSUMÉ DES UTILISATEURS :');
        $this->command->info('   ┌──────────────────────────────────────────────────────────────┐');
        $this->command->info('   │ Rôle              │ Email                    │ Mot de passe │');
        $this->command->info('   ├──────────────────────────────────────────────────────────────┤');
        $this->command->info('   │ Administrateur    │ pierrepapy@gmail.com     │ 12345678     │');
        $this->command->info('   │ Agent Recensement │ jean.dupont@email.com    │ password123  │');
        $this->command->info('   │ Opérateur         │ marie.mbala@email.com    │ operator123  │');
        $this->command->info('   └──────────────────────────────────────────────────────────────┘');
    }
}