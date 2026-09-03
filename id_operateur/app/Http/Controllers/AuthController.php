<?php

namespace App\Http\Controllers;

use App\Models\LogAudit;
use App\Models\Utilisateur;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class AuthController extends Controller
{
    // Connexion
    public function login(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'password' => 'required|string|min:6'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        // Chercher l'utilisateur
        $utilisateur = Utilisateur::where('email', $request->email)->first();

        if (!$utilisateur) {
            return response()->json([
                'success' => false,
                'message' => 'Email ou mot de passe incorrect'
            ], 401);
        }

        // Vérifier le mot de passe
        if (!Hash::check($request->password, $utilisateur->mot_de_passe_hash)) {
            // Incrémenter les tentatives
            $utilisateur->increment('tentatives_connexion');
            
            return response()->json([
                'success' => false,
                'message' => 'Email ou mot de passe incorrect'
            ], 401);
        }

        // Vérifier si le compte est actif
        if (!$utilisateur->est_actif) {
            return response()->json([
                'success' => false,
                'message' => 'Votre compte est désactivé. Veuillez contacter l\'administrateur.'
            ], 403);
        }

        // Vérifier si le compte est verrouillé
        if ($utilisateur->est_verrouille) {
            return response()->json([
                'success' => false,
                'message' => 'Votre compte est verrouillé. Veuillez contacter l\'administrateur.'
            ], 403);
        }

        // Mettre à jour la dernière connexion et réinitialiser les tentatives
        $utilisateur->update([
            'derniere_connexion' => now(),
            'tentatives_connexion' => 0
        ]);

        // Générer le token
        $token = $utilisateur->createToken('auth_token', ['*'])->plainTextToken;

        // Log audit login
        LogAudit::create([
            'utilisateur_id' => $utilisateur->id,
            'action' => 'LOGIN',
            'table_cible' => 'utilisateurs',
            'enregistrement_id' => $utilisateur->id,
            'nouvelles_valeurs' => ['email' => $utilisateur->email],
            'adresse_ip' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        // Charger les relations
        $utilisateur->load(['personne', 'roles']);

        return response()->json([
            'success' => true,
            'message' => 'Connexion réussie',
            'data' => [
                'token' => $token,
                'utilisateur' => $utilisateur,
                'roles' => $utilisateur->roles->map(function ($role) {
                    return [
                        'id' => $role->id,
                        'nom' => $role->nom,
                        'permissions' => $role->permissions->pluck('nom')
                    ];
                })
            ]
        ]);
    }

    // Déconnexion
    public function logout(Request $request)
    {
        $user = $request->user();

        LogAudit::create([
            'utilisateur_id' => $user->id,
            'action' => 'LOGOUT',
            'table_cible' => 'utilisateurs',
            'enregistrement_id' => $user->id,
            'anciennes_valeurs' => ['email' => $user->email],
            'adresse_ip' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        $user->currentAccessToken()->delete();

        return response()->json([
            'success' => true,
            'message' => 'Déconnexion réussie'
        ]);
    }

    // Récupérer l'utilisateur connecté
    public function me(Request $request)
    {
        $utilisateur = $request->user();
        $utilisateur->load(['personne', 'roles.permissions']);

        return response()->json([
            'success' => true,
            'data' => [
                'utilisateur' => $utilisateur,
                'roles' => $utilisateur->roles->map(function ($role) {
                    return [
                        'id' => $role->id,
                        'nom' => $role->nom,
                        'permissions' => $role->permissions->pluck('nom')
                    ];
                })
            ]
        ]);
    }

    // Changer le mot de passe
    public function changePassword(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'current_password' => 'required|string|min:6',
            'new_password' => 'required|string|min:6|confirmed'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $utilisateur = $request->user();

        // Vérifier l'ancien mot de passe
        if (!Hash::check($request->current_password, $utilisateur->mot_de_passe_hash)) {
            return response()->json([
                'success' => false,
                'message' => 'Mot de passe actuel incorrect'
            ], 401);
        }

        // Mettre à jour le mot de passe
        $utilisateur->mot_de_passe_hash = $request->new_password;
        $utilisateur->save();

        return response()->json([
            'success' => true,
            'message' => 'Mot de passe changé avec succès'
        ]);
    }
}