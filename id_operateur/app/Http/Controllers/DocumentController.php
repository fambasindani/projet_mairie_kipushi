<?php

namespace App\Http\Controllers;

use App\Models\Document;
use App\Models\Personne;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use App\Traits\OperateurScope;
use Illuminate\Support\Facades\Storage;

class DocumentController extends Controller
{
    use OperateurScope;
    /**
     * Liste des documents
     */
    public function index(Request $request)
    {
        $query = Document::with('personne');
        $this->scopeOperateur($query, $request);

        if ($request->has('personne_id') && !empty($request->personne_id)) {
            $query->where('personne_id', $request->personne_id);
        }

        if ($request->has('type_document') && !empty($request->type_document)) {
            $query->where('type_document', $request->type_document);
        }

        if ($request->has('est_valide')) {
            $query->where('est_valide', filter_var($request->est_valide, FILTER_VALIDATE_BOOLEAN));
        }

        if ($request->has('search') && !empty($request->search)) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('numero', 'LIKE', "%{$search}%")
                  ->orWhere('fichier', 'LIKE', "%{$search}%")
                  ->orWhereHas('personne', function ($pq) use ($search) {
                      $pq->where('nom', 'LIKE', "%{$search}%")
                         ->orWhere('prenom', 'LIKE', "%{$search}%")
                         ->orWhere('denomination_sociale', 'LIKE', "%{$search}%");
                  });
            });
        }

        $perPage = $request->get('per_page', 20);
        $documents = $query->orderBy('created_at', 'desc')->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $documents->items(),
            'pagination' => [
                'current_page' => $documents->currentPage(),
                'per_page' => $documents->perPage(),
                'total' => $documents->total(),
                'last_page' => $documents->lastPage(),
            ]
        ]);
    }

    /**
     * Upload d'un document
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'personne_id' => 'required|exists:personnes,id',
            'type_document' => 'required|in:CNI,PASSEPORT,STATUTS,RCCM,PATENTE,QUITTANCE,AVATAR,AUTRE',
            'numero' => 'nullable|string|max:100',
            'fichier' => 'required|file|max:10240|mimes:pdf,jpg,jpeg,png,doc,docx',
            'date_expiration' => 'nullable|date',
            'est_valide' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        // Upload du fichier
        $fichier = $request->file('fichier');
        $chemin = $fichier->store('documents/' . $request->personne_id, 'public');

        $data = $request->all();
        $data['fichier'] = $chemin;
        $data['est_valide'] = $request->est_valide ?? true;

        $document = Document::create($data);
        $document->load('personne');

        return response()->json([
            'success' => true,
            'message' => 'Document uploadé avec succès',
            'data' => $document
        ], 201);
    }

    /**
     * Afficher un document
     */
    public function show($id)
    {
        $document = Document::with('personne')->find($id);

        if (!$document) {
            return response()->json([
                'success' => false,
                'message' => 'Document non trouvé'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $document
        ]);
    }

    /**
     * Télécharger un document
     */
    public function download($id)
    {
        $document = Document::find($id);

        if (!$document) {
            return response()->json([
                'success' => false,
                'message' => 'Document non trouvé'
            ], 404);
        }

        if (!Storage::disk('public')->exists($document->fichier)) {
            return response()->json([
                'success' => false,
                'message' => 'Fichier introuvable'
            ], 404);
        }

        return Storage::disk('public')->download($document->fichier);
    }

    /**
     * Mettre à jour un document
     */
    public function update(Request $request, $id)
    {
        $document = Document::find($id);

        if (!$document) {
            return response()->json([
                'success' => false,
                'message' => 'Document non trouvé'
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'type_document' => 'sometimes|in:CNI,PASSEPORT,STATUTS,RCCM,PATENTE,QUITTANCE,AVATAR,AUTRE',
            'numero' => 'nullable|string|max:100',
            'date_expiration' => 'nullable|date',
            'est_valide' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $document->update($request->all());
        $document->load('personne');

        return response()->json([
            'success' => true,
            'message' => 'Document mis à jour avec succès',
            'data' => $document
        ]);
    }

    /**
     * Supprimer un document
     */
    public function destroy($id)
    {
        $document = Document::find($id);

        if (!$document) {
            return response()->json([
                'success' => false,
                'message' => 'Document non trouvé'
            ], 404);
        }

        // Supprimer le fichier physique
        if (Storage::disk('public')->exists($document->fichier)) {
            Storage::disk('public')->delete($document->fichier);
        }

        $document->delete();

        return response()->json([
            'success' => true,
            'message' => 'Document supprimé avec succès'
        ]);
    }

    /**
     * Types de documents disponibles
     */
    public function types()
    {
        $types = [
            'CNI' => 'Carte Nationale d\'Identité',
            'PASSEPORT' => 'Passeport',
            'STATUTS' => 'Statuts',
            'RCCM' => 'Registre de Commerce',
            'PATENTE' => 'Patente',
            'QUITTANCE' => 'Quittance',
            'AVATAR' => 'Photo de profil',
            'AUTRE' => 'Autre',
        ];

        return response()->json([
            'success' => true,
            'data' => $types
        ]);
    }
}