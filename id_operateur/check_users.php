<?php
require 'vendor/autoload.php';
$app = require 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
$users = App\Models\Utilisateur::select('id', 'nom_utilisateur', 'email', 'role_id', 'est_actif')->get();
foreach ($users as $u) {
    echo $u->id . ' | ' . $u->nom_utilisateur . ' | ' . $u->email . ' | role:' . $u->role_id . ' | actif:' . ($u->est_actif ? 'oui' : 'non') . PHP_EOL;
}
