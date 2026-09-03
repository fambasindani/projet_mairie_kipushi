<?php

namespace App\Http\Controllers;

use App\Models\Commune;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class CommuneController extends Controller
{
    public function index(Request $request)
    {
        $query = Commune::with(['ville', 'quartiers' => function ($q) {
            $q->select('id', 'commune_id', 'nom');
        }])->withCount('quartiers');

        if ($request->has('search')) {
            $search = $request->search;
            $query->where('nom', 'LIKE', "%{$search}%")
                  ->orWhere('code', 'LIKE', "%{$search}%");
        }

        if ($request->has('est_actif')) {
            $query->where('est_actif', filter_var($request->est_actif, FILTER_VALIDATE_BOOLEAN));
        }

        if ($request->has('id_ville') && !empty($request->id_ville)) {
            $query->where('id_ville', $request->id_ville);
        }

        $perPage = $request->get('per_page', 20);
        $communes = $query->orderBy('nom')->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $communes->items(),
            'pagination' => [
                'current_page' => $communes->currentPage(),
                'per_page' => $communes->perPage(),
                'total' => $communes->total(),
                'last_page' => $communes->lastPage(),
            ]
        ]);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'nom' => 'required|string|max:100',
            'code' => 'required|string|max:10|unique:communes,code',
            'id_ville' => 'nullable|exists:villes,id',
            'est_actif' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $data = $request->only(['nom', 'code', 'id_ville', 'est_actif']);
        $data['est_actif'] = $request->est_actif ?? true;

        $commune = Commune::create($data);

        return response()->json([
            'success' => true,
            'message' => 'Commune créée avec succès',
            'data' => $commune
        ], 201);
    }

    public function show($id)
    {
        $commune = Commune::with(['quartiers', 'ville'])->find($id);

        if (!$commune) {
            return response()->json([
                'success' => false,
                'message' => 'Commune non trouvée'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $commune
        ]);
    }

    public function quartiers($id)
    {
        $commune = Commune::find($id);

        if (!$commune) {
            return response()->json([
                'success' => false,
                'message' => 'Commune non trouvée'
            ], 404);
        }

        $quartiers = $commune->quartiers()->where('est_actif', true)->get();

        return response()->json([
            'success' => true,
            'data' => $quartiers
        ]);
    }

    public function update(Request $request, $id)
    {
        $commune = Commune::find($id);

        if (!$commune) {
            return response()->json([
                'success' => false,
                'message' => 'Commune non trouvée'
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'nom' => 'sometimes|string|max:100',
            'code' => 'sometimes|string|max:10|unique:communes,code,' . $id,
            'id_ville' => 'nullable|exists:villes,id',
            'est_actif' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $commune->update($request->only(['nom', 'code', 'id_ville', 'est_actif']));

        return response()->json([
            'success' => true,
            'message' => 'Commune mise à jour avec succès',
            'data' => $commune
        ]);
    }

    public function destroy($id)
    {
        $commune = Commune::withCount('quartiers')->find($id);

        if (!$commune) {
            return response()->json([
                'success' => false,
                'message' => 'Commune non trouvée'
            ], 404);
        }

        if ($commune->quartiers_count > 0) {
            return response()->json([
                'success' => false,
                'message' => 'Impossible de supprimer cette commune car elle a ' . $commune->quartiers_count . ' quartier(s)',
            ], 403);
        }

        $commune->delete();

        return response()->json([
            'success' => true,
            'message' => 'Commune supprimée avec succès'
        ]);
    }
}
