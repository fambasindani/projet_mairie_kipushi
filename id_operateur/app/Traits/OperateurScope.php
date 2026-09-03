<?php

namespace App\Traits;

use Illuminate\Http\Request;
use Illuminate\Database\Eloquent\Builder;

trait OperateurScope
{
    protected function scopeOperateur(Builder $query, Request $request, string $column = 'personne_id', ?callable $customScope = null): Builder
    {
        $user = $request->user();

        if (!$user) {
            return $query->whereRaw('1 = 0');
        }

        $isOperateur = $user->roles->contains('nom', 'Operateur');

        if ($isOperateur && $user->personne_id) {
            if ($customScope) {
                $customScope($query, $user->personne_id);
                return $query;
            }
            return $query->where($column, $user->personne_id);
        }

        return $query;
    }
}
