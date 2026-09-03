<?php

namespace App\Http\Controllers;

use App\Models\Province;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ProvinceController extends Controller
{
    public function index(Request $request)
    {
        $query = Province::withCount('villes');

        if ($request->has('search')) {
            $search = $request->search;
            $query->where('nom', 'LIKE', "%{$search}%")
                  ->orWhere('code', 'LIKE', "%{$search}%");
        }

        if ($request->has('est_actif')) {
            $query->where('est_actif', filter_var($request->est_actif, FILTER_VALIDATE_BOOLEAN));
        }

        $perPage = $request->get('per_page', 20);
        $provinces = $query->orderBy('nom')->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $provinces->items(),
            'pagination' => [
                'current_page' => $provinces->currentPage(),
                'per_page' => $provinces->perPage(),
                'total' => $provinces->total(),
                'last_page' => $provinces->lastPage(),
            ]
        ]);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'nom' => 'required|string|max:100',
            'code' => 'required|string|max:10|unique:provinces,code',
            'est_actif' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $data = $request->only(['nom', 'code', 'est_actif']);
        $data['est_actif'] = $request->est_actif ?? true;

        $province = Province::create($data);

        return response()->json([
            'success' => true,
            'message' => 'Province créée avec succès',
            'data' => $province
        ], 201);
    }

    public function show($id)
    {
        $province = Province::with('villes')->find($id);

        if (!$province) {
            return response()->json([
                'success' => false,
                'message' => 'Province non trouvée'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $province
        ]);
    }

    public function communes($id)
    {
        $province = Province::find($id);

        if (!$province) {
            return response()->json([
                'success' => false,
                'message' => 'Province non trouvée'
            ], 404);
        }

        $communes = \App\Models\Commune::whereHas('ville', function ($q) use ($province) {
            $q->where('id_province', $province->id);
        })->where('est_actif', true)->orderBy('nom')->get();

        return response()->json([
            'success' => true,
            'data' => $communes
        ]);
    }

    public function update(Request $request, $id)
    {
        $province = Province::find($id);

        if (!$province) {
            return response()->json([
                'success' => false,
                'message' => 'Province non trouvée'
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'nom' => 'sometimes|string|max:100',
            'code' => 'sometimes|string|max:10|unique:provinces,code,' . $id,
            'est_actif' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $province->update($request->only(['nom', 'code', 'est_actif']));

        return response()->json([
            'success' => true,
            'message' => 'Province mise à jour avec succès',
            'data' => $province
        ]);
    }

    public function destroy($id)
    {
        $province = Province::withCount('villes')->find($id);

        if (!$province) {
            return response()->json([
                'success' => false,
                'message' => 'Province non trouvée'
            ], 404);
        }

        if ($province->villes_count > 0) {
            return response()->json([
                'success' => false,
                'message' => 'Impossible de supprimer cette province car elle a ' . $province->villes_count . ' ville(s)',
            ], 403);
        }

        $province->delete();

        return response()->json([
            'success' => true,
            'message' => 'Province supprimée avec succès'
        ]);
    }
}
