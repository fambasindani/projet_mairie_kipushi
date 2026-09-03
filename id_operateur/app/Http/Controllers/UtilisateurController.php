<?php

namespace App\Http\Controllers;

use App\Models\Utilisateur;
use App\Models\Personne;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class UtilisateurController extends Controller
{
    // Liste des utilisateurs
    public function index(Request $request)
    {
        $query = Utilisateur::with(['personne', 'roles']);

        // Filtres
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('nom_utilisateur', 'LIKE', "%{$search}%")
                  ->orWhere('email', 'LIKE', "%{$search}%")
                  ->orWhereHas('personne', function ($pq) use ($search) {
                      $pq->where('nom', 'LIKE', "%{$search}%")
                         ->orWhere('prenom', 'LIKE', "%{$search}%");
                  });
            });
        }

        if ($request->has('est_actif')) {
            $query->where('est_actif', $request->est_actif);
        }

        $perPage = min($request->get('per_page', 20), 100);
        $utilisateurs = $query->orderBy('created_at', 'desc')->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $utilisateurs->items(),
            'pagination' => [
                'current_page' => $utilisateurs->currentPage(),
                'per_page' => $utilisateurs->perPage(),
                'total' => $utilisateurs->total(),
                'last_page' => $utilisateurs->lastPage(),
                'from' => $utilisateurs->firstItem(),
                'to' => $utilisateurs->lastItem(),
            ]
        ]);
    }

    // Créer un utilisateur
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'nom_utilisateur' => 'required|string|max:50|unique:utilisateurs',
            'email' => 'required|email|max:100|unique:utilisateurs',
            'password' => 'required|string|min:6',
            'personne_id' => 'required|exists:personnes,id|unique:utilisateurs,personne_id',
            'role_ids' => 'required|array',
            'role_ids.*' => 'exists:roles,id',
            'est_actif' => 'boolean'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $utilisateur = Utilisateur::create([
            'personne_id' => $request->personne_id,
            'nom_utilisateur' => $request->nom_utilisateur,
            'mot_de_passe_hash' => Hash::make($request->password),
            'email' => $request->email,
            'est_actif' => $request->est_actif ?? true
        ]);

        // Assigner les rôles
        if ($request->has('role_ids')) {
            $utilisateur->roles()->attach($request->role_ids);
        }

        $utilisateur->load(['personne', 'roles']);

        return response()->json([
            'success' => true,
            'message' => 'Utilisateur créé avec succès',
            'data' => $utilisateur
        ], 201);
    }

    // Afficher un utilisateur
    public function show($id)
    {
        $utilisateur = Utilisateur::with(['personne', 'roles.permissions'])->find($id);

        if (!$utilisateur) {
            return response()->json([
                'success' => false,
                'message' => 'Utilisateur non trouvé'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $utilisateur
        ]);
    }

    // Mettre à jour un utilisateur
    public function update(Request $request, $id)
    {
        $utilisateur = Utilisateur::find($id);

        if (!$utilisateur) {
            return response()->json([
                'success' => false,
                'message' => 'Utilisateur non trouvé'
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'nom_utilisateur' => 'sometimes|string|max:50|unique:utilisateurs,nom_utilisateur,' . $id,
            'email' => 'sometimes|email|max:100|unique:utilisateurs,email,' . $id,
            'password' => 'sometimes|string|min:6',
            'personne_id' => 'sometimes|exists:personnes,id|unique:utilisateurs,personne_id,' . $id,
            'role_ids' => 'sometimes|array',
            'role_ids.*' => 'exists:roles,id',
            'est_actif' => 'boolean',
            'est_verrouille' => 'boolean'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $data = $request->only([
            'nom_utilisateur',
            'email',
            'est_actif',
            'est_verrouille'
        ]);

        if ($request->has('personne_id')) {
            $data['personne_id'] = $request->personne_id;
        }

        if ($request->has('password') && !empty($request->password)) {
            $data['mot_de_passe_hash'] = Hash::make($request->password);
        }

        $utilisateur->update($data);

        // Mettre à jour les rôles
        if ($request->has('role_ids')) {
            $utilisateur->roles()->sync($request->role_ids);
        }

        $utilisateur->load(['personne', 'roles']);

        return response()->json([
            'success' => true,
            'message' => 'Utilisateur mis à jour avec succès',
            'data' => $utilisateur
        ]);
    }

    // Supprimer un utilisateur
    public function destroy($id)
    {
        $utilisateur = Utilisateur::find($id);

        if (!$utilisateur) {
            return response()->json([
                'success' => false,
                'message' => 'Utilisateur non trouvé'
            ], 404);
        }

        // Empêcher la suppression de son propre compte
        if (auth()->user()->id == $id) {
            return response()->json([
                'success' => false,
                'message' => 'Vous ne pouvez pas supprimer votre propre compte'
            ], 403);
        }

        $utilisateur->delete();

        return response()->json([
            'success' => true,
            'message' => 'Utilisateur supprimé avec succès'
        ]);
    }

    // Activer/Désactiver un utilisateur
    public function toggleActivation($id)
    {
        $utilisateur = Utilisateur::find($id);

        if (!$utilisateur) {
            return response()->json([
                'success' => false,
                'message' => 'Utilisateur non trouvé'
            ], 404);
        }

        $utilisateur->est_actif = !$utilisateur->est_actif;
        $utilisateur->save();

        return response()->json([
            'success' => true,
            'message' => $utilisateur->est_actif ? 'Utilisateur activé' : 'Utilisateur désactivé',
            'data' => $utilisateur
        ]);
    }
}