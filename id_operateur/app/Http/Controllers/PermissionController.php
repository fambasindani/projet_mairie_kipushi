<?php

namespace App\Http\Controllers;

use App\Models\Permission;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class PermissionController extends Controller
{
    // Liste des permissions
    public function index(Request $request)
    {
        $query = Permission::query();

        if ($request->has('search') && !empty($request->search)) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('nom', 'LIKE', "%{$search}%")
                  ->orWhere('description', 'LIKE', "%{$search}%")
                  ->orWhere('ressource', 'LIKE', "%{$search}%");
            });
        }

        if ($request->has('ressource') && !empty($request->ressource)) {
            $query->where('ressource', $request->ressource);
        }

        $perPage = min($request->get('per_page', 20), 100);
        $permissions = $query->orderBy('ressource')->orderBy('action')->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $permissions->items(),
            'pagination' => [
                'current_page' => $permissions->currentPage(),
                'per_page' => $permissions->perPage(),
                'total' => $permissions->total(),
                'last_page' => $permissions->lastPage(),
                'from' => $permissions->firstItem(),
                'to' => $permissions->lastItem(),
            ]
        ]);
    }

    // Toutes les permissions (pour assignation de rôles)
    public function all()
    {
        $permissions = Permission::orderBy('ressource')->orderBy('action')->get();
        return response()->json([
            'success' => true,
            'data' => $permissions,
        ]);
    }

    // Créer une permission
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'nom' => 'required|string|max:100|unique:permissions',
            'ressource' => 'required|string|max:50',
            'action' => 'required|string|max:20',
            'description' => 'nullable|string|max:255'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $permission = Permission::create($request->all());

        return response()->json([
            'success' => true,
            'message' => 'Permission créée avec succès',
            'data' => $permission
        ], 201);
    }

    // Afficher une permission
    public function show($id)
    {
        $permission = Permission::find($id);

        if (!$permission) {
            return response()->json([
                'success' => false,
                'message' => 'Permission non trouvée'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $permission
        ]);
    }

    // Mettre à jour une permission
    public function update(Request $request, $id)
    {
        $permission = Permission::find($id);

        if (!$permission) {
            return response()->json([
                'success' => false,
                'message' => 'Permission non trouvée'
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'nom' => 'sometimes|string|max:100|unique:permissions,nom,' . $id,
            'ressource' => 'sometimes|string|max:50',
            'action' => 'sometimes|string|max:20',
            'description' => 'nullable|string|max:255'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $permission->update($request->all());

        return response()->json([
            'success' => true,
            'message' => 'Permission mise à jour avec succès',
            'data' => $permission
        ]);
    }

    // Supprimer une permission
    public function destroy($id)
    {
        $permission = Permission::find($id);

        if (!$permission) {
            return response()->json([
                'success' => false,
                'message' => 'Permission non trouvée'
            ], 404);
        }

        $permission->delete();

        return response()->json([
            'success' => true,
            'message' => 'Permission supprimée avec succès'
        ]);
    }
}