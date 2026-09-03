<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\UtilisateurController;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\PermissionController;
use App\Http\Controllers\PersonneController;
use App\Http\Controllers\TaxeController;
use App\Http\Controllers\DeclarationPaiementController;
use App\Http\Controllers\FactureController;
use App\Http\Controllers\ActiviteEconomiqueController;
use App\Http\Controllers\BienImmobilierController;
use App\Http\Controllers\VehiculeController;
use App\Http\Controllers\PermisAutorisationController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\CommuneController;
use App\Http\Controllers\QuartierController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\ParametreController;
use App\Http\Controllers\AuditController;
use App\Http\Controllers\ProvinceController;
use App\Http\Controllers\VilleController;
use App\Http\Controllers\DocumentController;
use App\Http\Controllers\IdentifiantOfficielController;
use App\Http\Controllers\ActiviteOperateurController;
use App\Http\Controllers\RapportPersonnaliseController;
use App\Http\Controllers\ProfileController;



  


use Illuminate\Support\Facades\Route;
use Illuminate\Http\Request;





/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// ============================================================
// ROUTE DE TEST
// ============================================================
Route::get('/test', function () {
    return response()->json([
        'success' => true,
        'message' => 'API Mairie Opérateurs fonctionne !',
        'version' => '1.0.0',
        'timestamp' => now()
    ]);
});

// ============================================================
// ROUTES PUBLIQUES (SANS AUTHENTIFICATION)
// ============================================================
Route::post('/login', [AuthController::class, 'login']);

// ============================================================
// ROUTES PROTÉGÉES PAR AUTHENTIFICATION
// ============================================================
Route::middleware('auth:sanctum')->group(function () {
    
    // ============================================================
    // AUTHENTIFICATION & PROFIL
    // ============================================================
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/change-password', [AuthController::class, 'changePassword']);

    // ============================================================
    // GESTION DES UTILISATEURS
    // ============================================================
    Route::prefix('utilisateurs')->name('utilisateurs.')->group(function () {
        // Lecture
        Route::middleware(['permission:utilisateur:read'])->group(function () {
            Route::get('/', [UtilisateurController::class, 'index'])->name('index');
            Route::get('/{id}', [UtilisateurController::class, 'show'])->name('show');
        });

        // Création
        Route::middleware(['permission:utilisateur:create'])->group(function () {
            Route::post('/', [UtilisateurController::class, 'store'])->name('store');
        });

        // Mise à jour
        Route::middleware(['permission:utilisateur:update'])->group(function () {
            Route::put('/{id}', [UtilisateurController::class, 'update'])->name('update');
            Route::patch('/{id}/toggle-activation', [UtilisateurController::class, 'toggleActivation'])->name('toggle-activation');
        });

        // Suppression
        Route::middleware(['permission:utilisateur:delete'])->group(function () {
            Route::delete('/{id}', [UtilisateurController::class, 'destroy'])->name('destroy');
        });
    });

    // ============================================================
    // GESTION DES RÔLES
    // ============================================================
    Route::prefix('roles')->name('roles.')->group(function () {
        // Lecture
        Route::middleware(['permission:role:read'])->group(function () {
            Route::get('/', [RoleController::class, 'index'])->name('index');
            Route::get('/{id}', [RoleController::class, 'show'])->name('show');
        });

        // Création
        Route::middleware(['permission:role:create'])->group(function () {
            Route::post('/', [RoleController::class, 'store'])->name('store');
        });

        // Mise à jour
        Route::middleware(['permission:role:update'])->group(function () {
            Route::put('/{id}', [RoleController::class, 'update'])->name('update');
            Route::post('/{id}/permissions', [RoleController::class, 'assignPermissions'])->name('assign-permissions');
        });

        // Suppression
        Route::middleware(['permission:role:delete'])->group(function () {
            Route::delete('/{id}', [RoleController::class, 'destroy'])->name('destroy');
        });
    });

    // ============================================================
    // GESTION DES PERMISSIONS
    // ============================================================
    Route::prefix('permissions')->name('permissions.')->group(function () {
        // Lecture
        Route::middleware(['permission:permission:read'])->group(function () {
            Route::get('/', [PermissionController::class, 'index'])->name('index');
            Route::get('/{id}', [PermissionController::class, 'show'])->name('show');
        });

        // Création
        Route::middleware(['permission:permission:create'])->group(function () {
            Route::post('/', [PermissionController::class, 'store'])->name('store');
        });

        // Mise à jour
        Route::middleware(['permission:permission:update'])->group(function () {
            Route::put('/{id}', [PermissionController::class, 'update'])->name('update');
        });

        // Suppression
        Route::middleware(['permission:permission:delete'])->group(function () {
            Route::delete('/{id}', [PermissionController::class, 'destroy'])->name('destroy');
        });
    });

    // ============================================================
    // GESTION DES PERSONNES (OPÉRATEURS)
    // ============================================================
    Route::prefix('personnes')->name('personnes.')->group(function () {
        
        // Routes statiques (sans paramètre) - DOIVENT ÊTRE AVANT
        Route::middleware(['permission:operateur:read'])->group(function () {
            Route::get('/statistiques', [PersonneController::class, 'statistiques'])->name('statistiques');
            Route::get('/export', [PersonneController::class, 'export'])->name('export');
        });

        // Routes avec paramètres
        Route::middleware(['permission:operateur:read'])->group(function () {
            Route::get('/', [PersonneController::class, 'index'])->name('index');
            Route::get('/{id}', [PersonneController::class, 'show'])->name('show');
        });

        Route::middleware(['permission:operateur:create'])->group(function () {
            Route::post('/', [PersonneController::class, 'store'])->name('store');
        });

        Route::middleware(['permission:operateur:update'])->group(function () {
            Route::put('/{id}', [PersonneController::class, 'update'])->name('update');
            Route::patch('/{id}/formaliser', [PersonneController::class, 'formaliser'])->name('formaliser');
            Route::patch('/{id}/toggle-activation', [PersonneController::class, 'toggleActivation'])->name('toggle-activation');
        });

        Route::middleware(['permission:operateur:delete'])->group(function () {
            Route::delete('/{id}', [PersonneController::class, 'destroy'])->name('destroy');
        });
    });

    // ============================================================
    // GESTION DES ACTIVITÉS ÉCONOMIQUES
    // ============================================================
    Route::prefix('activites-economiques')->name('activites-economiques.')->group(function () {
        
        // Routes statiques (sans paramètre)
        Route::middleware(['permission:operateur:read'])->group(function () {
            Route::get('/secteurs', [ActiviteEconomiqueController::class, 'secteurs'])->name('secteurs');
            Route::get('/statistiques', [ActiviteEconomiqueController::class, 'statistiques'])->name('statistiques');
        });

        // Routes avec paramètres
        Route::middleware(['permission:operateur:read'])->group(function () {
            Route::get('/', [ActiviteEconomiqueController::class, 'index'])->name('index');
            Route::get('/{id}', [ActiviteEconomiqueController::class, 'show'])->name('show');
        });

        Route::middleware(['permission:operateur:create'])->group(function () {
            Route::post('/', [ActiviteEconomiqueController::class, 'store'])->name('store');
        });

        Route::middleware(['permission:operateur:update'])->group(function () {
            Route::put('/{id}', [ActiviteEconomiqueController::class, 'update'])->name('update');
            Route::patch('/{id}/toggle-activation', [ActiviteEconomiqueController::class, 'toggleActivation'])->name('toggle-activation');
        });

        Route::middleware(['permission:operateur:delete'])->group(function () {
            Route::delete('/{id}', [ActiviteEconomiqueController::class, 'destroy'])->name('destroy');
        });
    });

    // ============================================================
    // GESTION DES TAXES
    // ============================================================
    Route::prefix('taxes')->name('taxes.')->group(function () {
        
        // Routes statiques (sans paramètre)
        Route::middleware(['permission:taxe:read'])->group(function () {
            Route::get('/categories', [TaxeController::class, 'categories'])->name('categories');
            Route::get('/periodicites', [TaxeController::class, 'periodicites'])->name('periodicites');
            Route::get('/unites', [TaxeController::class, 'unites'])->name('unites');
            Route::get('/statistiques', [TaxeController::class, 'statistiques'])->name('statistiques');
        });

        // Routes avec paramètres
        Route::middleware(['permission:taxe:read'])->group(function () {
            Route::get('/', [TaxeController::class, 'index'])->name('index');
            Route::get('/{id}', [TaxeController::class, 'show'])->name('show');
        });

        Route::middleware(['permission:taxe:create'])->group(function () {
            Route::post('/', [TaxeController::class, 'store'])->name('store');
        });

        Route::middleware(['permission:taxe:update'])->group(function () {
            Route::put('/{id}', [TaxeController::class, 'update'])->name('update');
            Route::patch('/{id}/toggle-activation', [TaxeController::class, 'toggleActivation'])->name('toggle-activation');
        });

        Route::middleware(['permission:taxe:delete'])->group(function () {
            Route::delete('/{id}', [TaxeController::class, 'destroy'])->name('destroy');
        });
    });

    // ============================================================
    // GESTION DES DÉCLARATIONS DE PAIEMENT
    // ============================================================
    Route::prefix('declarations')->name('declarations.')->group(function () {
        
        // Routes statiques (sans paramètre)
        Route::middleware(['permission:paiement:read'])->group(function () {
            Route::get('/statistiques', [DeclarationPaiementController::class, 'statistiques'])->name('statistiques');
            Route::get('/export', [DeclarationPaiementController::class, 'export'])->name('export');
        });

        // Routes avec paramètres
        Route::middleware(['permission:paiement:read'])->group(function () {
            Route::get('/', [DeclarationPaiementController::class, 'index'])->name('index');
            Route::get('/{id}', [DeclarationPaiementController::class, 'show'])->name('show');
        });

        Route::middleware(['permission:paiement:create'])->group(function () {
            Route::post('/', [DeclarationPaiementController::class, 'store'])->name('store');
        });

        Route::middleware(['permission:paiement:validate'])->group(function () {
            Route::post('/{id}/valider', [DeclarationPaiementController::class, 'validerPaiement'])->name('valider');
            Route::post('/{id}/annuler', [DeclarationPaiementController::class, 'annuler'])->name('annuler');
            Route::post('/{id}/exonerer', [DeclarationPaiementController::class, 'exonerer'])->name('exonerer');
        });
    });

    // ============================================================
    // GESTION DES FACTURES
    // ============================================================
    Route::prefix('factures')->name('factures.')->group(function () {
        Route::middleware(['permission:facture:read'])->group(function () {
            Route::get('/statistiques', [FactureController::class, 'statistiques'])->name('statistiques');
            Route::get('/', [FactureController::class, 'index'])->name('index');
            Route::get('/{id}', [FactureController::class, 'show'])->name('show');
        });

        Route::middleware(['permission:facture:create'])->group(function () {
            Route::post('/', [FactureController::class, 'store'])->name('store');
        });

        Route::middleware(['permission:facture:update'])->group(function () {
            Route::put('/{id}', [FactureController::class, 'update'])->name('update');
        });

        Route::middleware(['permission:facture:delete'])->group(function () {
            Route::delete('/{id}', [FactureController::class, 'destroy'])->name('destroy');
        });
    });

    // ============================================================
    // GESTION DES PROVINCES
    // ============================================================
    Route::prefix('provinces')->name('provinces.')->group(function () {
        Route::middleware(['permission:operateur:read'])->group(function () {
            Route::get('/', [ProvinceController::class, 'index'])->name('index');
            Route::get('/{id}', [ProvinceController::class, 'show'])->name('show');
            Route::get('/{id}/communes', [ProvinceController::class, 'communes'])->name('communes');
        });

        Route::middleware(['permission:operateur:create'])->group(function () {
            Route::post('/', [ProvinceController::class, 'store'])->name('store');
        });

        Route::middleware(['permission:operateur:update'])->group(function () {
            Route::put('/{id}', [ProvinceController::class, 'update'])->name('update');
        });

        Route::middleware(['permission:operateur:delete'])->group(function () {
            Route::delete('/{id}', [ProvinceController::class, 'destroy'])->name('destroy');
        });
    });

    // ============================================================
    // GESTION DES VILLES
    // ============================================================
    Route::prefix('villes')->name('villes.')->group(function () {
        Route::middleware(['permission:operateur:read'])->group(function () {
            Route::get('/', [VilleController::class, 'index'])->name('index');
            Route::get('/{id}', [VilleController::class, 'show'])->name('show');
            Route::get('/{id}/communes', [VilleController::class, 'communes'])->name('communes');
        });

        Route::middleware(['permission:operateur:create'])->group(function () {
            Route::post('/', [VilleController::class, 'store'])->name('store');
        });

        Route::middleware(['permission:operateur:update'])->group(function () {
            Route::put('/{id}', [VilleController::class, 'update'])->name('update');
        });

        Route::middleware(['permission:operateur:delete'])->group(function () {
            Route::delete('/{id}', [VilleController::class, 'destroy'])->name('destroy');
        });
    });

    // ============================================================
    // GESTION DES COMMUNES
    // ============================================================
    Route::prefix('communes')->name('communes.')->group(function () {
        Route::middleware(['permission:operateur:read'])->group(function () {
            Route::get('/', [CommuneController::class, 'index'])->name('index');
            Route::get('/{id}', [CommuneController::class, 'show'])->name('show');
            Route::get('/{id}/quartiers', [CommuneController::class, 'quartiers'])->name('quartiers');
            Route::get('/statistiques', [CommuneController::class, 'statistiques'])->name('statistiques');
        });

        Route::middleware(['permission:operateur:create'])->group(function () {
            Route::post('/', [CommuneController::class, 'store'])->name('store');
        });

        Route::middleware(['permission:operateur:update'])->group(function () {
            Route::put('/{id}', [CommuneController::class, 'update'])->name('update');
            Route::patch('/{id}/toggle-activation', [CommuneController::class, 'toggleActivation'])->name('toggle-activation');
        });

        Route::middleware(['permission:operateur:delete'])->group(function () {
            Route::delete('/{id}', [CommuneController::class, 'destroy'])->name('destroy');
        });
    });

    // ============================================================
    // GESTION DES QUARTIERS
    // ============================================================
    Route::prefix('quartiers')->name('quartiers.')->group(function () {
        
        // Routes statiques (sans paramètre)
        Route::middleware(['permission:operateur:read'])->group(function () {
            Route::get('/statistiques', [QuartierController::class, 'statistiques'])->name('statistiques');
        });

        // Routes avec paramètres
        Route::middleware(['permission:operateur:read'])->group(function () {
            Route::get('/', [QuartierController::class, 'index'])->name('index');
            Route::get('/{id}', [QuartierController::class, 'show'])->name('show');
            Route::get('/commune/{communeId}', [QuartierController::class, 'parCommune'])->name('par-commune');
        });

        Route::middleware(['permission:operateur:create'])->group(function () {
            Route::post('/', [QuartierController::class, 'store'])->name('store');
        });

        Route::middleware(['permission:operateur:update'])->group(function () {
            Route::put('/{id}', [QuartierController::class, 'update'])->name('update');
            Route::patch('/{id}/toggle-activation', [QuartierController::class, 'toggleActivation'])->name('toggle-activation');
        });

        Route::middleware(['permission:operateur:delete'])->group(function () {
            Route::delete('/{id}', [QuartierController::class, 'destroy'])->name('destroy');
        });
    });

    // ============================================================
    // GESTION DES BIENS IMMOBILIERS
    // ============================================================
    Route::prefix('biens-immobiliers')->name('biens-immobiliers.')->group(function () {
        
        // Routes statiques (sans paramètre)
        Route::middleware(['permission:operateur:read'])->group(function () {
            Route::get('/types', [BienImmobilierController::class, 'types'])->name('types');
            Route::get('/statistiques', [BienImmobilierController::class, 'statistiques'])->name('statistiques');
            Route::get('/export', [BienImmobilierController::class, 'export'])->name('export');
            Route::get('/proprietaire/{id}', [BienImmobilierController::class, 'parProprietaire'])->name('par-proprietaire');
            Route::get('/type/{type}', [BienImmobilierController::class, 'parType'])->name('par-type');
            Route::get('/resume/proprietaire/{id}', [BienImmobilierController::class, 'resumeProprietaire'])->name('resume-proprietaire');
        });

        // Routes avec paramètres
        Route::middleware(['permission:operateur:read'])->group(function () {
            Route::get('/', [BienImmobilierController::class, 'index'])->name('index');
            Route::get('/{id}', [BienImmobilierController::class, 'show'])->name('show');
        });

        Route::middleware(['permission:operateur:create'])->group(function () {
            Route::post('/', [BienImmobilierController::class, 'store'])->name('store');
        });

        Route::middleware(['permission:operateur:update'])->group(function () {
            Route::put('/{id}', [BienImmobilierController::class, 'update'])->name('update');
            Route::patch('/{id}', [BienImmobilierController::class, 'update'])->name('patch');
            Route::patch('/{id}/toggle-activation', [BienImmobilierController::class, 'toggleActivation'])->name('toggle-activation');
        });

        Route::middleware(['permission:operateur:delete'])->group(function () {
            Route::delete('/{id}', [BienImmobilierController::class, 'destroy'])->name('destroy');
        });
    });

    // ============================================================
    // GESTION DES VÉHICULES
    // ============================================================
    Route::prefix('vehicules')->name('vehicules.')->group(function () {
        
        // Routes statiques (sans paramètre)
        Route::middleware(['permission:operateur:read'])->group(function () {
            Route::get('/types', [VehiculeController::class, 'types'])->name('types');
            Route::get('/statistiques', [VehiculeController::class, 'statistiques'])->name('statistiques');
            Route::get('/export', [VehiculeController::class, 'export'])->name('export');
            Route::get('/proprietaire/{id}', [VehiculeController::class, 'parProprietaire'])->name('par-proprietaire');
            Route::get('/type/{type}', [VehiculeController::class, 'parType'])->name('par-type');
            Route::get('/resume/proprietaire/{id}', [VehiculeController::class, 'resumeProprietaire'])->name('resume-proprietaire');
        });

        // Routes avec paramètres
        Route::middleware(['permission:operateur:read'])->group(function () {
            Route::get('/', [VehiculeController::class, 'index'])->name('index');
            Route::get('/{id}', [VehiculeController::class, 'show'])->name('show');
        });

        Route::middleware(['permission:operateur:create'])->group(function () {
            Route::post('/', [VehiculeController::class, 'store'])->name('store');
        });

        Route::middleware(['permission:operateur:update'])->group(function () {
            Route::put('/{id}', [VehiculeController::class, 'update'])->name('update');
            Route::patch('/{id}', [VehiculeController::class, 'update'])->name('patch');
            Route::patch('/{id}/toggle-activation', [VehiculeController::class, 'toggleActivation'])->name('toggle-activation');
        });

        Route::middleware(['permission:operateur:delete'])->group(function () {
            Route::delete('/{id}', [VehiculeController::class, 'destroy'])->name('destroy');
        });
    });

    // ============================================================
    // GESTION DES PERMIS ET AUTORISATIONS
    // ============================================================
    Route::prefix('permis')->name('permis.')->group(function () {
        
        // Routes statiques (sans paramètre)
        Route::middleware(['permission:permis:read'])->group(function () {
            Route::get('/types', [PermisAutorisationController::class, 'types'])->name('types');
            Route::get('/statistiques', [PermisAutorisationController::class, 'statistiques'])->name('statistiques');
        });

        // Routes avec paramètres
        Route::middleware(['permission:permis:read'])->group(function () {
            Route::get('/', [PermisAutorisationController::class, 'index'])->name('index');
            Route::get('/{id}', [PermisAutorisationController::class, 'show'])->name('show');
        });

        Route::middleware(['permission:permis:create'])->group(function () {
            Route::post('/', [PermisAutorisationController::class, 'store'])->name('store');
        });

        Route::middleware(['permission:permis:update'])->group(function () {
            Route::put('/{id}', [PermisAutorisationController::class, 'update'])->name('update');
            Route::patch('/{id}', [PermisAutorisationController::class, 'update'])->name('patch');
            Route::patch('/{id}/toggle-validation', [PermisAutorisationController::class, 'toggleValidation'])->name('toggle-validation');
        });

        Route::middleware(['permission:permis:delete'])->group(function () {
            Route::delete('/{id}', [PermisAutorisationController::class, 'destroy'])->name('destroy');
        });
    });

    // ============================================================
    // DASHBOARD / STATISTIQUES GLOBALES
    // ============================================================
    Route::prefix('dashboard')->name('dashboard.')->group(function () {
        Route::middleware(['permission:statistique:read'])->group(function () {
            Route::get('/global', [DashboardController::class, 'global'])->name('global');
            Route::get('/operateurs', [DashboardController::class, 'operateurs'])->name('operateurs');
            Route::get('/finances', [DashboardController::class, 'finances'])->name('finances');
            Route::get('/taxes', [DashboardController::class, 'taxes'])->name('taxes');
            Route::get('/activites', [DashboardController::class, 'activites'])->name('activites');
        });
    });

    // ============================================================
    // GESTION DES NOTIFICATIONS
    // ============================================================
    Route::prefix('notifications')->name('notifications.')->group(function () {
        Route::middleware(['permission:operateur:read'])->group(function () {
            Route::get('/', [NotificationController::class, 'index'])->name('index');
            Route::get('/{id}', [NotificationController::class, 'show'])->name('show');
            Route::get('/non-lues', [NotificationController::class, 'nonLues'])->name('non-lues');
        });

        Route::middleware(['permission:operateur:update'])->group(function () {
            Route::patch('/{id}/lire', [NotificationController::class, 'marquerCommeLue'])->name('marquer-lue');
            Route::patch('/lire-toutes', [NotificationController::class, 'marquerToutesCommeLues'])->name('marquer-toutes-lues');
        });

        Route::middleware(['permission:operateur:create'])->group(function () {
            Route::post('/', [NotificationController::class, 'store'])->name('store');
        });

        Route::middleware(['permission:operateur:delete'])->group(function () {
            Route::delete('/{id}', [NotificationController::class, 'destroy'])->name('destroy');
        });
    });

    // ============================================================
    // GESTION DES PARAMÈTRES
    // ============================================================
    Route::prefix('parametres')->name('parametres.')->group(function () {
        Route::middleware(['permission:utilisateur:read'])->group(function () {
            Route::get('/', [ParametreController::class, 'index'])->name('index');
            Route::get('/{cle}', [ParametreController::class, 'show'])->name('show');
        });

        Route::middleware(['permission:utilisateur:update'])->group(function () {
            Route::put('/{cle}', [ParametreController::class, 'update'])->name('update');
            Route::patch('/{cle}', [ParametreController::class, 'update'])->name('update-partial');
        });
    });

    // ============================================================
    // LOGS D'AUDIT
    // ============================================================
    Route::prefix('audit')->name('audit.')->group(function () {
        Route::middleware(['permission:audit:read'])->group(function () {
            Route::get('/logs', [AuditController::class, 'index'])->name('index');
            Route::get('/logs/{id}', [AuditController::class, 'show'])->name('show');
            Route::get('/logs/table/{table}', [AuditController::class, 'parTable'])->name('par-table');
            Route::get('/logs/action/{action}', [AuditController::class, 'parAction'])->name('par-action');
            Route::get('/logs/utilisateur/{utilisateurId}', [AuditController::class, 'parUtilisateur'])->name('par-utilisateur');
            Route::get('/statistiques', [AuditController::class, 'statistiques'])->name('statistiques');
        });
    });


    // ============================================================
// GESTION DES IDENTIFIANTS OFFICIELS
// ============================================================
// ============================================================
// GESTION DES IDENTIFIANTS OFFICIELS
// ============================================================
Route::prefix('identifiants')->name('identifiants.')->group(function () {
    
    // ⚠️ IMPORTANT : Les routes statiques DOIVENT être AVANT les routes avec paramètres {id}
    
    // ROUTES STATIQUES (sans paramètre) - DOIVENT ÊTRE AVANT
    Route::middleware(['permission:operateur:read'])->group(function () {
        Route::get('/types', [IdentifiantOfficielController::class, 'types'])->name('types');
    });

    // ROUTES AVEC PARAMÈTRES
    Route::middleware(['permission:operateur:read'])->group(function () {
        Route::get('/', [IdentifiantOfficielController::class, 'index'])->name('index');
        Route::get('/{id}', [IdentifiantOfficielController::class, 'show'])->name('show');
    });

    Route::middleware(['permission:operateur:create'])->group(function () {
        Route::post('/', [IdentifiantOfficielController::class, 'store'])->name('store');
    });

    Route::middleware(['permission:operateur:update'])->group(function () {
        Route::put('/{id}', [IdentifiantOfficielController::class, 'update'])->name('update');
    });

    Route::middleware(['permission:operateur:delete'])->group(function () {
        Route::delete('/{id}', [IdentifiantOfficielController::class, 'destroy'])->name('destroy');
    });
});

// ============================================================
// GESTION DES DOCUMENTS
// ============================================================
// ============================================================
// GESTION DES DOCUMENTS
// ============================================================
// ============================================================
// GESTION DES DOCUMENTS
// ============================================================
Route::prefix('documents')->name('documents.')->group(function () {
    
    // 1. ROUTES STATIQUES (sans paramètre) - AVANT les routes avec {id}
    Route::middleware(['auth:sanctum', 'permission:operateur:read'])->group(function () {
        Route::get('/types', [DocumentController::class, 'types'])->name('types');
    });

    // 2. ROUTES AVEC PARAMÈTRES
    Route::middleware(['auth:sanctum', 'permission:operateur:read'])->group(function () {
        Route::get('/', [DocumentController::class, 'index'])->name('index');
        Route::get('/{id}', [DocumentController::class, 'show'])->name('show');
        Route::get('/{id}/download', [DocumentController::class, 'download'])->name('download');
    });

    Route::middleware(['auth:sanctum', 'permission:operateur:create'])->group(function () {
        Route::post('/', [DocumentController::class, 'store'])->name('store');
    });

    Route::middleware(['auth:sanctum', 'permission:operateur:update'])->group(function () {
        Route::put('/{id}', [DocumentController::class, 'update'])->name('update');
    });

    Route::middleware(['auth:sanctum', 'permission:operateur:delete'])->group(function () {
        Route::delete('/{id}', [DocumentController::class, 'destroy'])->name('destroy');
    });
});


// GESTION DES ACTIVITÉS DES OPÉRATEURS
// ============================================================
Route::prefix('operateur-activites')->name('operateur-activites.')->group(function () {
    Route::middleware(['permission:operateur:update'])->group(function () {
        Route::post('/assigner', [ActiviteOperateurController::class, 'assigner'])->name('assigner');
        Route::delete('/{personneId}/{activiteId}', [ActiviteOperateurController::class, 'supprimer'])->name('supprimer');
    });

    Route::middleware(['permission:operateur:read'])->group(function () {
        Route::get('/{personneId}', [ActiviteOperateurController::class, 'getActivites'])->name('get');
    });
});

// ============================================================
// GESTION DU PROFIL UTILISATEUR
// ============================================================
Route::prefix('profile')->name('profile.')->group(function () {
    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/', [ProfileController::class, 'show'])->name('show');
        Route::put('/', [ProfileController::class, 'update'])->name('update');
        Route::post('/change-password', [ProfileController::class, 'changePassword'])->name('change-password');
        Route::post('/upload-avatar', [ProfileController::class, 'uploadAvatar'])->name('upload-avatar');
        Route::get('/statistiques', [ProfileController::class, 'statistiques'])->name('statistiques');
        Route::get('/historique-connexions', [ProfileController::class, 'historiqueConnexions'])->name('historique-connexions');
    });
});

// ============================================================
// GESTION DES FACTURES
// ============================================================
Route::prefix('factures')->name('factures.')->group(function () {
    Route::middleware(['permission:facture:read'])->group(function () {
        Route::get('/statistiques', [FactureController::class, 'statistiques'])->name('statistiques');
        Route::get('/', [FactureController::class, 'index'])->name('index');
        Route::get('/{id}/download', [FactureController::class, 'download'])->name('download');
        Route::get('/{id}', [FactureController::class, 'show'])->name('show');
    });

    Route::middleware(['permission:facture:create'])->group(function () {
        Route::post('/', [FactureController::class, 'store'])->name('store');
    });

    Route::middleware(['permission:facture:update'])->group(function () {
        Route::put('/{id}', [FactureController::class, 'update'])->name('update');
        Route::post('/{id}/annuler', [FactureController::class, 'annuler'])->name('annuler');
    });

    Route::middleware(['permission:facture:delete'])->group(function () {
        Route::delete('/{id}', [FactureController::class, 'destroy'])->name('destroy');
    });
});



// ============================================================
// GESTION DES RAPPORTS PERSONNALISÉS
// ============================================================
Route::prefix('rapports')->name('rapports.')->group(function () {
    Route::middleware(['permission:statistique:read'])->group(function () {
        Route::post('/generer', [RapportPersonnaliseController::class, 'generer'])->name('generer');
    });
});



}); // Fin middleware auth:sanctum

// ============================================================
// ROUTES DE TEST (SANS AUTHENTIFICATION)
// ============================================================
Route::get('/health', function () {
    return response()->json([
        'status' => 'OK',
        'timestamp' => now(),
        'environment' => app()->environment(),
        'version' => '1.0.0'
    ]);
});

Route::get('/ping', function () {
    return response()->json(['pong' => true, 'timestamp' => now()]);
});