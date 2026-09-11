<?php
require 'vendor/autoload.php';
$app = require 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
$users = App\Models\Utilisateur::all()->first();
if ($users) {
    echo 'Columns: ' . implode(', ', $users->getAttributes()) . PHP_EOL;
}
$cols = \Illuminate\Support\Facades\DB::getSchemaBuilder()->getColumnListing('utilisateurs');
echo 'Table cols: ' . implode(', ', $cols) . PHP_EOL;
$u = \Illuminate\Support\Facades\DB::table('utilisateurs')->first();
if ($u) echo json_encode((array)$u) . PHP_EOL;
