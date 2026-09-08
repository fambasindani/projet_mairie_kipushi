<?php

namespace App\Http\Controllers;

use App\Models\RecuPerception;
use Illuminate\Http\Request;
use chillerlan\QRCode\{QRCode, QROptions};
use chillerlan\QRCode\Data\QRMatrix;
use chillerlan\QRCode\Output\QROutputInterface;

class RecuPerceptionVerifyController extends Controller
{
    /**
     * Vérification publique d'un reçu (QR code scan)
     */
    public function verify($numero)
    {
        $recu = RecuPerception::with(['taxe', 'personne', 'percepteur'])
            ->where('numero', $numero)
            ->first();

        if (!$recu) {
            return response()->json([
                'success' => false,
                'message' => 'Reçu introuvable',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'numero' => $recu->numero,
                'type_perception' => $recu->type_perception,
                'type_label' => $recu->type_perception_label,
                'taxe' => $recu->taxe?->nom ?? '—',
                'date_emission' => $recu->date_emission->format('d/m/Y'),
                'heure_emission' => $recu->heure_emission,
                'montant' => $recu->montant,
                'statut' => 'valide',
                'operateur' => $recu->personne?->nom_complet ?? null,
                'chauffeur' => $recu->chauffeur_nom ?? $recu->conducteur_nom ?? null,
                'plaque' => $recu->plaque_immatriculation ?? null,
                'trajet' => $recu->trajet_label ?? null,
                'designation' => $recu->designation ?? null,
                'poids' => $recu->poids ?? null,
                'percepteur' => $recu->percepteur ? trim($recu->percepteur->prenom . ' ' . $recu->percepteur->nom) : null,
            ],
        ]);
    }

    /**
     * Page HTML de vérification pour mobile
     */
    public function verifyPage($numero)
    {
        $recu = RecuPerception::with(['taxe', 'personne', 'percepteur'])
            ->where('numero', $numero)
            ->first();

        if (!$recu) {
            return response()->view('verify.error', ['numero' => $numero], 404);
        }

        return response()->view('verify.receipt', ['recu' => $recu]);
    }

    /**
     * Générer le QR code en base64 pour un reçu
     */
    public static function generateQRCodeBase64(string $numero): string
    {
        $url = config('app.url', 'http://localhost:8000') . "/verifier-recu/{$numero}";

        $options = new QROptions([
            'outputType' => QROutputInterface::GDIMAGE_PNG,
            'eccLevel' => QRCode::ECC_M,
            'scale' => 5,
            'imageBase64' => false,
            'bgColor' => [255, 255, 255],
            'drawLightModules' => true,
            'outputBase64' => true,
        ]);

        $qr = new QRCode($options);
        $data = $qr->render($url);

        return $data;
    }
}
