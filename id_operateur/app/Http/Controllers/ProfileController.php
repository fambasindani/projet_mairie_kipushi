<?php

namespace App\Http\Controllers;

use App\Models\Utilisateur;
use App\Models\Personne;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class ProfileController extends Controller
{
    /**
     * Afficher le profil de l'utilisateur connecté
     */
    public function show(Request $request)
    {
        $user = $request->user();
        $user->load(['personne', 'roles.permissions']);

        return response()->json([
            'success' => true,
            'data' => [
                'utilisateur' => $user,
                'personne' => $user->personne,
                'roles' => $user->roles,
                'permissions' => $user->roles->flatMap->permissions->unique('nom')->values()
            ]
        ]);
    }

    /**
     * Mettre à jour le profil de l'utilisateur
     */
    public function update(Request $request)
    {
        $user = $request->user();
        $personne = $user->personne;

        $validator = Validator::make($request->all(), [
            'nom' => 'nullable|string|max:100',
            'prenom' => 'nullable|string|max:100',
            'email' => 'nullable|email|max:100|unique:personnes,email,' . $personne->id,
            'telephone' => 'nullable|string|max:30',
            'adresse' => 'nullable|string',
            'commune' => 'nullable|string|max:100',
            'ville' => 'nullable|string|max:100',
            'province' => 'nullable|string|max:100',
            'avatar' => 'nullable|string|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        // Mettre à jour la personne
        $personne->update($request->only([
            'nom', 'prenom', 'email', 'telephone', 
            'adresse', 'commune', 'ville', 'province', 'avatar'
        ]));

        // Si l'email est changé, mettre à jour aussi l'utilisateur
        if ($request->has('email') && $request->email !== $user->email) {
            $user->update(['email' => $request->email]);
        }

        $user->load('personne');

        return response()->json([
            'success' => true,
            'message' => 'Profil mis à jour avec succès',
            'data' => $user
        ]);
    }

    /**
     * Changer le mot de passe
     */
    public function changePassword(Request $request)
    {
        $user = $request->user();

        $validator = Validator::make($request->all(), [
            'current_password' => 'required|string|min:6',
            'new_password' => 'required|string|min:6|confirmed',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        // Vérifier l'ancien mot de passe
        if (!Hash::check($request->current_password, $user->mot_de_passe_hash)) {
            return response()->json([
                'success' => false,
                'message' => 'Mot de passe actuel incorrect'
            ], 401);
        }

        // Mettre à jour le mot de passe
        $user->mot_de_passe_hash = Hash::make($request->new_password);
        $user->save();

        return response()->json([
            'success' => true,
            'message' => 'Mot de passe changé avec succès'
        ]);
    }

    /**
     * Uploader une photo de profil
     */
    public function uploadAvatar(Request $request)
    {
        $user = $request->user();

        $validator = Validator::make($request->all(), [
            'avatar' => 'required|image|max:2048|mimes:jpg,jpeg,png,gif',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $avatar = $request->file('avatar');
        $chemin = $avatar->store('avatars/' . $user->id, 'public');

        // Mettre à jour la personne
        $user->personne->update(['avatar' => $chemin]);

        return response()->json([
            'success' => true,
            'message' => 'Photo de profil mise à jour',
            'data' => [
                'avatar' => asset('storage/' . $chemin)
            ]
        ]);
    }

    /**
     * Statistiques personnelles de l'utilisateur
     */
    public function statistiques(Request $request)
    {
        $user = $request->user();
        $personne = $user->personne;

        $stats = [
            'personne' => [
                'id' => $personne->id,
                'nom_complet' => $personne->nom_complet,
                'email' => $personne->email,
                'telephone' => $personne->telephone,
            ],
            'utilisateur' => [
                'nom_utilisateur' => $user->nom_utilisateur,
                'est_actif' => $user->est_actif,
                'derniere_connexion' => $user->derniere_connexion,
                'roles' => $user->roles->pluck('nom'),
            ],
            'activites' => $personne->activites()->count(),
            'biens' => $personne->biensImmobiliers()->count(),
            'vehicules' => $personne->vehicules()->count(),
            'permis' => $personne->permisAutorisations()->count(),
            'paiements' => [
                'total' => $personne->declarationsPaiements()->count(),
                'montant_total' => $personne->declarationsPaiements()->sum('montant_total'),
                'en_attente' => $personne->declarationsPaiements()->where('statut', 'en_attente')->count(),
                'payes' => $personne->declarationsPaiements()->where('statut', 'paye')->count(),
            ],
            'documents' => $personne->documents()->count(),
        ];

        return response()->json([
            'success' => true,
            'data' => $stats
        ]);
    }

    /**
     * Historique des connexions
     */
    public function historiqueConnexions(Request $request)
    {
        $user = $request->user();

        $historique = [
            'derniere_connexion' => $user->derniere_connexion,
            'tentatives' => $user->tentatives_connexion,
            'date_creation' => $user->created_at,
            'logs' => $user->logsAudit()
                ->where('action', 'login')
                ->orderBy('created_at', 'desc')
                ->limit(10)
                ->get()
        ];

        return response()->json([
            'success' => true,
            'data' => $historique
        ]);
    }
}