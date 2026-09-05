<?php
define('LARAVEL_START', microtime(true));
require __DIR__.'/vendor/autoload.php';
$app = require __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);
$kernel->bootstrap();

$user = App\Models\Utilisateur::find(7);
$token = $user->createToken('test-api')->plainTextToken;
echo "Token created\n";

$client = new \GuzzleHttp\Client();
$baseUrl = 'http://127.0.0.1:8000/api';

$endpoints = [
    '/me',
    '/declarations?per_page=5',
    '/factures?per_page=5',
    '/biens-immobiliers?per_page=5',
    '/vehicules?per_page=5',
    '/permis?per_page=5',
    '/declarations/statistiques',
];

foreach ($endpoints as $ep) {
    try {
        $res = $client->get($baseUrl . $ep, [
            'headers' => ['Authorization' => 'Bearer ' . $token, 'Accept' => 'application/json'],
        ]);
        $body = json_decode($res->getBody(), true);
        echo "\n=== GET $ep === STATUS: " . $res->getStatusCode() . "\n";
        if (isset($body['data']) && is_array($body['data'])) {
            if (isset($body['pagination'])) {
                echo "  Paginated: " . count($body['data']) . " items (total: " . ($body['pagination']['total'] ?? '?') . ")\n";
            } else {
                echo "  data: " . substr(json_encode($body['data']), 0, 400) . "\n";
            }
        } else {
            echo "  response: " . substr(json_encode($body), 0, 400) . "\n";
        }
    } catch (\GuzzleHttp\Exception\RequestException $e) {
        echo "\n=== GET $ep === ERROR: " . $e->getMessage() . "\n";
        if ($e->hasResponse()) {
            echo "  Body: " . substr((string)$e->getResponse()->getBody(), 0, 300) . "\n";
        }
    } catch (\Exception $e) {
        echo "\n=== GET $ep === ERROR: " . $e->getMessage() . "\n";
    }
}
