<?php

namespace App\Providers;

use Illuminate\Auth\Events\Registered;
use Illuminate\Auth\Listeners\SendEmailVerificationNotification;
use Illuminate\Foundation\Support\Providers\EventServiceProvider as ServiceProvider;
use Illuminate\Support\Facades\Event;

use App\Models\Personne;
use App\Models\Utilisateur;
use App\Models\Taxe;
use App\Models\Vehicule;
use App\Models\BienImmobilier;
use App\Models\PermisAutorisation;
use App\Models\ActiviteEconomique;
use App\Models\Province;
use App\Models\Ville;
use App\Models\Commune;
use App\Models\Quartier;
use App\Models\Role;
use App\Models\Permission;
use App\Observers\AuditObserver;

class EventServiceProvider extends ServiceProvider
{
    protected $listen = [
        Registered::class => [
            SendEmailVerificationNotification::class,
        ],
    ];

    protected $observers = [
        Personne::class => AuditObserver::class,
        Utilisateur::class => AuditObserver::class,
        Taxe::class => AuditObserver::class,
        Vehicule::class => AuditObserver::class,
        BienImmobilier::class => AuditObserver::class,
        PermisAutorisation::class => AuditObserver::class,
        ActiviteEconomique::class => AuditObserver::class,
        Province::class => AuditObserver::class,
        Ville::class => AuditObserver::class,
        Commune::class => AuditObserver::class,
        Quartier::class => AuditObserver::class,
        Role::class => AuditObserver::class,
        Permission::class => AuditObserver::class,
    ];

    public function boot(): void
    {
        //
    }

    public function shouldDiscoverEvents(): bool
    {
        return false;
    }
}
