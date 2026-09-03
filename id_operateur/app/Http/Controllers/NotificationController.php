<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use App\Models\Personne;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class NotificationController extends Controller
{
    /**
     * Liste des notifications avec pagination et recherche
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $query = Notification::with('personne')->where('personne_id', $user->personne_id);

        // Filtrer par personne
        if ($request->has('personne_id') && !empty($request->personne_id)) {
            $query->where('personne_id', $request->personne_id);
        }

        // Filtrer par type
        if ($request->has('type_notification') && !empty($request->type_notification)) {
            $query->where('type_notification', $request->type_notification);
        }

        // Filtrer par statut de lecture
        if ($request->has('est_lue')) {
            $query->where('est_lue', filter_var($request->est_lue, FILTER_VALIDATE_BOOLEAN));
        }

        // Recherche
        if ($request->has('search') && !empty($request->search)) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('sujet', 'LIKE', "%{$search}%")
                  ->orWhere('message', 'LIKE', "%{$search}%")
                  ->orWhere('type_notification', 'LIKE', "%{$search}%")
                  ->orWhereHas('personne', function ($pq) use ($search) {
                      $pq->where('nom', 'LIKE', "%{$search}%")
                         ->orWhere('prenom', 'LIKE', "%{$search}%")
                         ->orWhere('email', 'LIKE', "%{$search}%");
                  });
            });
        }

        // Filtres par date
        if ($request->has('date_debut') && !empty($request->date_debut)) {
            $query->whereDate('date_envoi', '>=', $request->date_debut);
        }

        if ($request->has('date_fin') && !empty($request->date_fin)) {
            $query->whereDate('date_envoi', '<=', $request->date_fin);
        }

        // Tri
        $sortField = $request->get('sort', 'created_at');
        $sortOrder = $request->get('order', 'desc');
        $allowedSorts = ['id', 'sujet', 'type_notification', 'est_lue', 'date_envoi', 'created_at'];
        if (in_array($sortField, $allowedSorts)) {
            $query->orderBy($sortField, $sortOrder);
        }

        // Pagination
        $perPage = $request->get('per_page', 20);
        $perPage = min($perPage, 100);

        $notifications = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $notifications->items(),
            'pagination' => [
                'current_page' => $notifications->currentPage(),
                'per_page' => $notifications->perPage(),
                'total' => $notifications->total(),
                'last_page' => $notifications->lastPage(),
            ],
            'filters' => $request->all()
        ]);
    }

    /**
     * Créer une notification
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'personne_id' => 'required|exists:personnes,id',
            'type_notification' => 'required|in:paiement_echu,renouvellement_permis,controle_prochain,information',
            'sujet' => 'required|string|max:255',
            'message' => 'required|string',
            'lien_action' => 'nullable|string|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $data = $request->all();
        $data['date_envoi'] = now();
        $data['est_lue'] = false;

        $notification = Notification::create($data);
        $notification->load('personne');

        return response()->json([
            'success' => true,
            'message' => 'Notification créée avec succès',
            'data' => $notification
        ], 201);
    }

    /**
     * Afficher une notification
     */
    public function show($id)
    {
        $notification = Notification::with('personne')->find($id);

        if (!$notification) {
            return response()->json([
                'success' => false,
                'message' => 'Notification non trouvée'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $notification
        ]);
    }

    /**
     * Marquer une notification comme lue
     */
    public function marquerCommeLue($id)
    {
        $notification = Notification::find($id);

        if (!$notification) {
            return response()->json([
                'success' => false,
                'message' => 'Notification non trouvée'
            ], 404);
        }

        $notification->marquerCommeLue();

        return response()->json([
            'success' => true,
            'message' => 'Notification marquée comme lue',
            'data' => $notification
        ]);
    }

    /**
     * Marquer toutes les notifications d'une personne comme lues
     */
    public function marquerToutesCommeLues(Request $request)
    {
        $user = $request->user();

        $count = Notification::where('personne_id', $user->personne_id)
            ->where('est_lue', false)
            ->update([
                'est_lue' => true,
                'date_lecture' => now()
            ]);

        return response()->json([
            'success' => true,
            'message' => $count . ' notification(s) marquée(s) comme lue(s)',
            'count' => $count
        ]);
    }

    /**
     * Obtenir les notifications non lues d'une personne
     */
    public function nonLues(Request $request)
    {
        $user = $request->user();

        $notifications = Notification::where('personne_id', $user->personne_id)
            ->where('est_lue', false)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $notifications,
            'total' => $notifications->count()
        ]);
    }

    /**
     * Supprimer une notification
     */
    public function destroy($id)
    {
        $notification = Notification::find($id);

        if (!$notification) {
            return response()->json([
                'success' => false,
                'message' => 'Notification non trouvée'
            ], 404);
        }

        $notification->delete();

        return response()->json([
            'success' => true,
            'message' => 'Notification supprimée avec succès'
        ]);
    }

    /**
     * Statistiques des notifications
     */
    public function statistiques(Request $request)
    {
        $user = $request->user();
        $query = Notification::where('personne_id', $user->personne_id);

        $stats = [
            'total' => $query->count(),
            'non_lues' => (clone $query)->where('est_lue', false)->count(),
            'lues' => (clone $query)->where('est_lue', true)->count(),
            'par_type' => (clone $query)->select('type_notification')
                ->selectRaw('count(*) as total')
                ->groupBy('type_notification')
                ->get()
                ->map(function ($item) {
                    $labels = [
                        'paiement_echu' => 'Paiement échu',
                        'renouvellement_permis' => 'Renouvellement de permis',
                        'controle_prochain' => 'Contrôle à venir',
                        'information' => 'Information',
                    ];
                    return [
                        'type' => $labels[$item->type_notification] ?? $item->type_notification,
                        'total' => $item->total
                    ];
                }),
            'dernieres' => (clone $query)->orderBy('created_at', 'desc')->limit(5)->get(),
        ];

        return response()->json([
            'success' => true,
            'data' => $stats
        ]);
    }
}