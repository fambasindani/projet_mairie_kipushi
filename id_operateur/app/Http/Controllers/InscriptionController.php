<?php

namespace App\Http\Controllers;

use App\Models\Utilisateur;
use App\Models\Personne;
use App\Models\Role;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class InscriptionController extends Controller
{
    /**
     * Inscription publique d'un assujetti (pas d'auth requise)
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            // Personne
            'type' => 'required|in:physique,morale',
            'nom' => 'required|string|max:255',
            'prenom' => 'nullable|string|max:255',
            'sexe' => 'nullable|in:M,F,Autre',
            'date_naissance' => 'nullable|date|before:today',
            'lieu_naissance' => 'nullable|string|max:255',
            'nationalite' => 'nullable|string|max:100',
            'adresse' => 'nullable|string|max:500',
            'email' => 'required|email|max:255|unique:utilisateurs,email',
            'telephone' => 'nullable|string|max:20',
            'denomination_sociale' => 'nullable|string|max:255',
            'forme_juridique' => 'nullable|string|max:100',
            'id_quartier' => 'nullable|exists:quartiers,id',

            // Identifiants
            'type_identifiant' => 'nullable|string|in:RCCM,IDNAT,NUMERO_IMPOT,NIF,CNSS,ONEM,PASSEPORT,PERMIS_CONDURE',
            'valeur_identifiant' => 'nullable|string|max:255',

            // Activité
            'activite_id' => 'nullable|exists:activites_economiques,id',
            'date_debut_activite' => 'nullable|date',

            // Compte
            'mot_de_passe' => 'required|string|min:8|confirmed',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            DB::beginTransaction();

            // 1. Créer la personne
            $personne = Personne::create([
                'type' => $request->type,
                'nom' => $request->nom,
                'prenom' => $request->prenom,
                'sexe' => $request->sexe,
                'date_naissance' => $request->date_naissance,
                'lieu_naissance' => $request->lieu_naissance,
                'nationalite' => $request->nationalite ?? 'Congolaise',
                'adresse' => $request->adresse,
                'email' => $request->email,
                'telephone' => $request->telephone,
                'denomination_sociale' => $request->denomination_sociale,
                'forme_juridique' => $request->forme_juridique,
                'id_quartier' => $request->id_quartier,
            ]);

            // 2. Créer le compte utilisateur (inactif, en attente)
            $utilisateur = Utilisateur::create([
                'personne_id' => $personne->id,
                'nom_utilisateur' => $request->email,
                'email' => $request->email,
                'mot_de_passe_hash' => Hash::make($request->mot_de_passe),
                'est_actif' => false,
                'statut_inscription' => 'en_attente',
                'date_inscription' => now()->toDateString(),
            ]);

            // 3. Créer l'identifiant officiel si fourni
            if ($request->type_identifiant && $request->valeur_identifiant) {
                $personne->identifiantsOfficiels()->create([
                    'type_identifiant' => $request->type_identifiant,
                    'valeur' => $request->valeur_identifiant,
                ]);
            }

            // 4. Assigner l'activité si fournie
            if ($request->activite_id) {
                $personne->activites()->attach($request->activite_id, [
                    'date_debut' => $request->date_debut_activite ?? now()->toDateString(),
                ]);
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Votre inscription a été soumise avec succès. Elle sera examinée par un administrateur. Vous recevrez une confirmation par email.',
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'inscription: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Lister les inscriptions en attente (admin)
     */
    public function index(Request $request)
    {
        $query = Utilisateur::with(['personne', 'roles'])
            ->where('statut_inscription', '!=', 'approuve');

        if ($request->has('statut') && !empty($request->statut)) {
            $query->where('statut_inscription', $request->statut);
        }

        $perPage = min($request->get('per_page', 20), 100);
        $inscriptions = $query->orderBy('date_inscription', 'desc')->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $inscriptions->items(),
            'pagination' => [
                'current_page' => $inscriptions->currentPage(),
                'per_page' => $inscriptions->perPage(),
                'total' => $inscriptions->total(),
                'last_page' => $inscriptions->lastPage(),
            ]
        ]);
    }

    /**
     * Détail d'une inscription
     */
    public function show($id)
    {
        $utilisateur = Utilisateur::with([
            'personne',
            'personne.identifiants',
            'personne.activites',
            'personne.quartier',
            'personne.quartier.commune',
            'roles'
        ])->find($id);

        if (!$utilisateur) {
            return response()->json(['success' => false, 'message' => 'Inscription non trouvée'], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $utilisateur
        ]);
    }

    /**
     * Approuver une inscription
     */
    public function approuver($id)
    {
        $utilisateur = Utilisateur::find($id);

        if (!$utilisateur) {
            return response()->json(['success' => false, 'message' => 'Inscription non trouvée'], 404);
        }

        if ($utilisateur->statut_inscription !== 'en_attente') {
            return response()->json(['success' => false, 'message' => 'Cette inscription n\'est pas en attente'], 422);
        }

        // Trouver le rôle Operateur
        $roleOperateur = Role::where('nom', 'Operateur')->first();

        $utilisateur->update([
            'est_actif' => true,
            'statut_inscription' => 'approuve',
        ]);

        // Assigner le rôle Operateur
        if ($roleOperateur) {
            $utilisateur->roles()->sync([$roleOperateur->id]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Inscription approuvée. Le compte est maintenant actif.',
            'data' => $utilisateur->fresh(['personne', 'roles'])
        ]);
    }

    /**
     * Rejeter une inscription
     */
    public function rejeter(Request $request, $id)
    {
        $utilisateur = Utilisateur::find($id);

        if (!$utilisateur) {
            return response()->json(['success' => false, 'message' => 'Inscription non trouvée'], 404);
        }

        if ($utilisateur->statut_inscription !== 'en_attente') {
            return response()->json(['success' => false, 'message' => 'Cette inscription n\'est pas en attente'], 422);
        }

        $validator = Validator::make($request->all(), [
            'motif' => 'required|string|max:500',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $utilisateur->update([
            'statut_inscription' => 'rejete',
            'motif_rejet' => $request->motif,
            'est_actif' => false,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Inscription rejetée.',
            'data' => $utilisateur->fresh(['personne'])
        ]);
    }
}
