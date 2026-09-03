<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class PersonneSeeder extends Seeder
{
    public function run(): void
    {
        // Personne pour l'admin
        DB::table('personnes')->insert([
            'type' => 'physique',
            'nom' => 'Papy',
            'prenom' => 'Pierre',
            'email' => 'pierrepapy@gmail.com',
            'est_actif' => true,
            'est_formalise' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Quelques personnes de test
        DB::table('personnes')->insert([
            'type' => 'physique',
            'nom' => 'Dupont',
            'prenom' => 'Jean',
            'email' => 'jean.dupont@email.com',
            'est_actif' => true,
            'est_formalise' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        DB::table('personnes')->insert([
            'type' => 'physique',
            'nom' => 'Mbala',
            'prenom' => 'Marie',
            'email' => 'marie.mbala@email.com',
            'est_actif' => true,
            'est_formalise' => false,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }
}