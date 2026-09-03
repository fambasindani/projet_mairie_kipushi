<?php

namespace App\Http\Controllers;

use App\Models\Ville;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class VilleController extends Controller
{
    public function index(Request $request)
    {
        $query = Ville::with(['province', 'communes' => function ($q) {
            $q->select('id', 'id_ville', 'nom');
        }])->withCount('communes');

        if ($request->has('search')) {
            $search = $request->search;
            $query->where('nom', 'LIKE', "%{$search}%")
                  ->orWhere('code', 'LIKE', "%{$search}%");
        }

        if ($request->has('est_actif')) {
            $query->where('est_actif', filter_var($request->est_actif, FILTER_VALIDATE_BOOLEAN));
        }

        if ($request->has('id_province') && !empty($request->id_province)) {
            $query->where('id_province', $request->id_province);
        }

        $perPage = $request->get('per_page', 20);
        $villes = $query->orderBy('nom')->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $villes->items(),
            'pagination' => [
                'current_page' => $villes->currentPage(),
                'per_page' => $villes->perPage(),
                'total' => $villes->total(),
                'last_page' => $villes->lastPage(),
            ]
        ]);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'nom' => 'required|string|max:100',
            'code' => 'required|string|max:10|unique:villes,code',
            'id_province' => 'nullable|exists:provinces,id',
            'est_actif' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $data = $request->only(['nom', 'code', 'id_province', 'est_actif']);
        $data['est_actif'] = $request->est_actif ?? true;

        $ville = Ville::create($data);

        return response()->json([
            'success' => true,
            'message' => 'Ville créée avec succès',
            'data' => $ville
        ], 201);
    }

    public function show($id)
    {
        $ville = Ville::with(['communes', 'province'])->find($id);

        if (!$ville) {
            return response()->json([
                'success' => false,
                'message' => 'Ville non trouvée'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $ville
        ]);
    }

    public function communes($id)
    {
        $ville = Ville::find($id);

        if (!$ville) {
            return response()->json([
                'success' => false,
                'message' => 'Ville non trouvée'
            ], 404);
        }

        $communes = $ville->communes()->where('est_actif', true)->orderBy('nom')->get();

        return response()->json([
            'success' => true,
            'data' => $communes
        ]);
    }

    public function update(Request $request, $id)
    {
        $ville = Ville::find($id);

        if (!$ville) {
            return response()->json([
                'success' => false,
                'message' => 'Ville non trouvée'
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'nom' => 'sometimes|string|max:100',
            'code' => 'sometimes|string|max:10|unique:villes,code,' . $id,
            'id_province' => 'nullable|exists:provinces,id',
            'est_actif' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $ville->update($request->only(['nom', 'code', 'id_province', 'est_actif']));

        return response()->json([
            'success' => true,
            'message' => 'Ville mise à jour avec succès',
            'data' => $ville
        ]);
    }

    public function destroy($id)
    {
        $ville = Ville::withCount('communes')->find($id);

        if (!$ville) {
            return response()->json([
                'success' => false,
                'message' => 'Ville non trouvée'
            ], 404);
        }

        if ($ville->communes_count > 0) {
            return response()->json([
                'success' => false,
                'message' => 'Impossible de supprimer cette ville car elle a ' . $ville->communes_count . ' commune(s)',
            ], 403);
        }

        $ville->delete();

        return response()->json([
            'success' => true,
            'message' => 'Ville supprimée avec succès'
        ]);
    }
}
