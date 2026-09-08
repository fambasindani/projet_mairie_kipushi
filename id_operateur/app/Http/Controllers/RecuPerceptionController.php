<?php

namespace App\Http\Controllers;

use App\Models\RecuPerception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class RecuPerceptionController extends Controller
{
    /**
     * Liste des reçus de perception
     */
    public function index(Request $request)
    {
        $query = RecuPerception::with(['taxe', 'personne', 'percepteur']);

        $user = $request->user();
        if ($user && $user->hasRole('Operateur')) {
            $query->where('percepteur_id', $user->id);
        }

        if ($request->type_perception) {
            $query->where('type_perception', $request->type_perception);
        }
        if ($request->date_debut) {
            $query->whereDate('date_emission', '>=', $request->date_debut);
        }
        if ($request->date_fin) {
            $query->whereDate('date_emission', '<=', $request->date_fin);
        }
        if ($request->taxe_id) {
            $query->where('taxe_id', $request->taxe_id);
        }
        if ($request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('numero', 'like', "%{$search}%")
                  ->orWhere('plaque_immatriculation', 'like', "%{$search}%")
                  ->orWhere('chauffeur_nom', 'like', "%{$search}%")
                  ->orWhere('conducteur_nom', 'like', "%{$search}%")
                  ->orWhere('designation', 'like', "%{$search}%");
            });
        }

        $perPage = $request->input('per_page', 15);
        $recus = $query->orderBy('date_emission', 'desc')->orderBy('id', 'desc')->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $recus,
        ]);
    }

    /**
     * Détail d'un reçu
     */
    public function show($id)
    {
        $recu = RecuPerception::with(['taxe', 'personne', 'percepteur'])->find($id);

        if (!$recu) {
            return response()->json(['success' => false, 'message' => 'Reçu non trouvé'], 404);
        }

        return response()->json(['success' => true, 'data' => $recu]);
    }

    /**
     * Créer un reçu de perception
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'taxe_id' => 'required|exists:taxes,id',
            'personne_id' => 'nullable|exists:personnes,id',
            'type_perception' => 'required|string|max:50',
            'date_emission' => 'required|date',
            'heure_emission' => 'nullable',
            'categorie_vehicule' => 'nullable|string|max:50',
            'plaque_immatriculation' => 'nullable|string|max:20',
            'montant' => 'required|numeric|min:0',
            'trajet' => 'nullable|in:aller,retour,aller_retour',
            'chauffeur_nom' => 'nullable|string|max:100',
            'conducteur_nom' => 'nullable|string|max:100',
            'Numero_Piece' => 'nullable|string|max:50',
            'designation' => 'nullable|string|max:100',
            'poids' => 'nullable|numeric|min:0',
            'observations' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $data = $validator->validated();

        // Préfixe selon le type
        $prefixes = [
            'peage_urbain' => 'PEA',
            'pont_bascule' => 'PON',
            'etalage' => 'ETA',
            'chargement' => 'CHA',
            'dechargement' => 'DEC',
            'autre' => 'AUT',
        ];
        $prefixe = $prefixes[$data['type_perception']] ?? 'GEN';
        $data['numero'] = RecuPerception::prochainNumero($prefixe);
        $data['percepteur_id'] = $request->user()->id;

        $recu = RecuPerception::create($data);
        $recu->load(['taxe', 'personne', 'percepteur']);

        return response()->json(['success' => true, 'data' => $recu], 201);
    }

    /**
     * Mettre à jour un reçu
     */
    public function update(Request $request, $id)
    {
        $recu = RecuPerception::find($id);

        if (!$recu) {
            return response()->json(['success' => false, 'message' => 'Reçu non trouvé'], 404);
        }

        $validator = Validator::make($request->all(), [
            'taxe_id' => 'sometimes|exists:taxes,id',
            'personne_id' => 'nullable|exists:personnes,id',
            'type_perception' => 'sometimes|string|max:50',
            'date_emission' => 'sometimes|date',
            'heure_emission' => 'nullable',
            'categorie_vehicule' => 'nullable|string|max:50',
            'plaque_immatriculation' => 'nullable|string|max:20',
            'montant' => 'sometimes|numeric|min:0',
            'trajet' => 'nullable|in:aller,retour,aller_retour',
            'chauffeur_nom' => 'nullable|string|max:100',
            'conducteur_nom' => 'nullable|string|max:100',
            'Numero_Piece' => 'nullable|string|max:50',
            'designation' => 'nullable|string|max:100',
            'poids' => 'nullable|numeric|min:0',
            'observations' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $recu->update($validator->validated());
        $recu->load(['taxe', 'personne', 'percepteur']);

        return response()->json(['success' => true, 'data' => $recu]);
    }

    /**
     * Supprimer un reçu
     */
    public function destroy($id)
    {
        $recu = RecuPerception::find($id);

        if (!$recu) {
            return response()->json(['success' => false, 'message' => 'Reçu non trouvé'], 404);
        }

        $recu->delete();

        return response()->json(['success' => true, 'message' => 'Reçu supprimé']);
    }

    /**
     * Prochain numéro de série
     */
    public function prochainNumero(Request $request)
    {
        $type = $request->type_perception ?? 'peage_urbain';
        $prefixes = [
            'peage_urbain' => 'PEA',
            'pont_bascule' => 'PON',
            'etalage' => 'ETA',
            'chargement' => 'CHA',
            'dechargement' => 'DEC',
            'autre' => 'AUT',
        ];
        $prefixe = $prefixes[$type] ?? 'GEN';

        return response()->json([
            'success' => true,
            'data' => ['numero' => RecuPerception::prochainNumero($prefixe)],
        ]);
    }

    /**
     * Statistiques des reçus
     */
    public function stats(Request $request)
    {
        $query = RecuPerception::query();

        $user = $request->user();
        if ($user && $user->hasRole('Operateur')) {
            $query->where('percepteur_id', $user->id);
        }

        if ($request->type_perception) {
            $query->where('type_perception', $request->type_perception);
        }
        if ($request->date_debut) {
            $query->whereDate('date_emission', '>=', $request->date_debut);
        }
        if ($request->date_fin) {
            $query->whereDate('date_emission', '<=', $request->date_fin);
        }

        $total = (clone $query)->count();
        $montantTotal = (clone $query)->sum('montant');

        $parType = (clone RecuPerception::query())
            ->select('type_perception')
            ->selectRaw('count(*) as total, sum(montant) as montant')
            ->groupBy('type_perception')
            ->orderBy('montant', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'total_recus' => $total,
                'montant_total' => $montantTotal,
                'par_type' => $parType,
            ],
        ]);
    }

    /**
     * Types de perception disponibles
     */
    public function types()
    {
        return response()->json([
            'success' => true,
            'data' => RecuPerception::TYPES,
        ]);
    }

    /**
     * QR code d'un reçu
     */
    public function qrcode($id)
    {
        $recu = RecuPerception::find($id);

        if (!$recu) {
            return response()->json(['success' => false, 'message' => 'Reçu non trouvé'], 404);
        }

        $url = config('app.url', 'http://localhost:8000') . "/verifier-recu/{$recu->numero}";

        return response()->json([
            'success' => true,
            'data' => [
                'numero' => $recu->numero,
                'url' => $url,
            ],
        ]);
    }
}
