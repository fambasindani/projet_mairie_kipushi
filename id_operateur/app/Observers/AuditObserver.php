<?php

namespace App\Observers;

use App\Models\LogAudit;

class AuditObserver
{
    public function created($model)
    {
        $this->log('CREATE', $model, null, $model->getAttributes());
    }

    public function updated($model)
    {
        $dirty = $model->getDirty();
        $original = $model->getOriginal();
        $old = [];
        foreach ($dirty as $key => $value) {
            $old[$key] = $original[$key] ?? null;
        }
        $this->log('UPDATE', $model, $old, $dirty);
    }

    public function deleted($model)
    {
        $this->log('DELETE', $model, $model->getAttributes(), null);
    }

    protected function log($action, $model, $old, $new)
    {
        $table = $model->getTable();

        if ($table === 'log_audits') {
            return;
        }

        $userId = null;
        try {
            $user = request()->user();
            if ($user) {
                $userId = $user->id;
            }
        } catch (\Exception $e) {
            $userId = null;
        }

        LogAudit::withoutEvents(function () use ($action, $model, $table, $old, $new, $userId) {
                LogAudit::create([
            'utilisateur_id' => $userId,
            'action' => $action,
            'table_cible' => $table,
            'enregistrement_id' => $model->getKey(),
            'anciennes_valeurs' => $old,
            'nouvelles_valeurs' => $new,
            'adresse_ip' => request()->ip(),
            'user_agent' => request()->userAgent(),
            ]);
        });
    }
}
