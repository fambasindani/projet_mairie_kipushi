<?php

namespace App\Http\Controllers;

use App\Models\LogAudit;
use App\Models\Utilisateur;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class AuditController extends Controller
{
    /**
     * Liste des logs d'audit avec pagination et recherche
     */
    public function index(Request $request)
    {
        $query = LogAudit::with('utilisateur');

        // Recherche
        if ($request->has('search') && !empty($request->search)) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('action', 'LIKE', "%{$search}%")
                  ->orWhere('table_cible', 'LIKE', "%{$search}%")
                  ->orWhere('adresse_ip', 'LIKE', "%{$search}%")
                  ->orWhereHas('utilisateur', function ($uq) use ($search) {
                      $uq->where('nom_utilisateur', 'LIKE', "%{$search}%")
                         ->orWhere('email', 'LIKE', "%{$search}%");
                  });
            });
        }

        // Filtres
        if ($request->has('action') && !empty($request->action)) {
            $query->where('action', $request->action);
        }

        if ($request->has('table_cible') && !empty($request->table_cible)) {
            $query->where('table_cible', $request->table_cible);
        }

        if ($request->has('utilisateur_id') && !empty($request->utilisateur_id)) {
            $query->where('utilisateur_id', $request->utilisateur_id);
        }

        // Filtres par date
        if ($request->has('date_debut') && !empty($request->date_debut)) {
            $query->whereDate('created_at', '>=', $request->date_debut);
        }

        if ($request->has('date_fin') && !empty($request->date_fin)) {
            $query->whereDate('created_at', '<=', $request->date_fin);
        }

        // Tri
        $sortField = $request->get('sort', 'created_at');
        $sortOrder = $request->get('order', 'desc');
        $allowedSorts = ['id', 'action', 'table_cible', 'adresse_ip', 'created_at'];
        if (in_array($sortField, $allowedSorts)) {
            $query->orderBy($sortField, $sortOrder);
        }

        // Pagination
        $perPage = $request->get('per_page', 20);
        $perPage = min($perPage, 100);

        $logs = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $logs->items(),
            'pagination' => [
                'current_page' => $logs->currentPage(),
                'per_page' => $logs->perPage(),
                'total' => $logs->total(),
                'last_page' => $logs->lastPage(),
            ],
            'filters' => $request->all()
        ]);
    }

    /**
     * Afficher un log d'audit
     */
    public function show($id)
    {
        $log = LogAudit::with('utilisateur')->find($id);

        if (!$log) {
            return response()->json([
                'success' => false,
                'message' => 'Log d\'audit non trouvé'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $log
        ]);
    }

    /**
     * Logs par table
     */
    public function parTable($table, Request $request)
    {
        $perPage = min($request->get('per_page', 20), 100);
        $logs = LogAudit::with('utilisateur')
            ->where('table_cible', $table)
            ->orderBy('created_at', 'desc')
            ->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $logs->items(),
            'pagination' => [
                'current_page' => $logs->currentPage(),
                'per_page' => $logs->perPage(),
                'total' => $logs->total(),
                'last_page' => $logs->lastPage(),
            ]
        ]);
    }

    /**
     * Logs par action
     */
    public function parAction($action, Request $request)
    {
        $perPage = min($request->get('per_page', 20), 100);
        $logs = LogAudit::with('utilisateur')
            ->where('action', $action)
            ->orderBy('created_at', 'desc')
            ->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $logs->items(),
            'pagination' => [
                'current_page' => $logs->currentPage(),
                'per_page' => $logs->perPage(),
                'total' => $logs->total(),
                'last_page' => $logs->lastPage(),
            ]
        ]);
    }

    /**
     * Logs par utilisateur
     */
    public function parUtilisateur($utilisateurId, Request $request)
    {
        $utilisateur = Utilisateur::find($utilisateurId);

        if (!$utilisateur) {
            return response()->json([
                'success' => false,
                'message' => 'Utilisateur non trouvé'
            ], 404);
        }

        $perPage = min($request->get('per_page', 20), 100);
        $logs = LogAudit::where('utilisateur_id', $utilisateurId)
            ->orderBy('created_at', 'desc')
            ->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $logs->items(),
            'pagination' => [
                'current_page' => $logs->currentPage(),
                'per_page' => $logs->perPage(),
                'total' => $logs->total(),
                'last_page' => $logs->lastPage(),
            ]
        ]);
    }

    /**
     * Statistiques des logs d'audit
     */
    public function statistiques(Request $request)
    {
        $stats = [
            'total' => LogAudit::count(),
            'par_action' => LogAudit::select('action')
                ->selectRaw('count(*) as total')
                ->groupBy('action')
                ->orderBy('total', 'desc')
                ->get()
                ->map(function ($item) {
                    $labels = [
                        'create' => 'Création',
                        'read' => 'Lecture',
                        'update' => 'Modification',
                        'delete' => 'Suppression',
                        'login' => 'Connexion',
                        'logout' => 'Déconnexion',
                    ];
                    return [
                        'action' => $labels[$item->action] ?? $item->action,
                        'total' => $item->total
                    ];
                }),
            'par_table' => LogAudit::select('table_cible')
                ->selectRaw('count(*) as total')
                ->whereNotNull('table_cible')
                ->groupBy('table_cible')
                ->orderBy('total', 'desc')
                ->limit(10)
                ->get(),
            'par_jour' => LogAudit::selectRaw('DATE(created_at) as jour')
                ->selectRaw('count(*) as total')
                ->groupBy('jour')
                ->orderBy('jour', 'desc')
                ->limit(30)
                ->get(),
            'derniers' => LogAudit::with('utilisateur')
                ->orderBy('created_at', 'desc')
                ->limit(10)
                ->get(),
            'utilisateurs_actifs' => LogAudit::select('utilisateur_id')
                ->with('utilisateur')
                ->selectRaw('count(*) as total')
                ->groupBy('utilisateur_id')
                ->orderBy('total', 'desc')
                ->limit(10)
                ->get()
                ->map(function ($item) {
                    return [
                        'utilisateur' => $item->utilisateur->nom_utilisateur ?? 'N/A',
                        'email' => $item->utilisateur->email ?? 'N/A',
                        'total' => $item->total
                    ];
                }),
        ];

        return response()->json([
            'success' => true,
            'data' => $stats
        ]);
    }
}