<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Affectation extends Model
{
    use HasFactory;

    protected $fillable = [
        'manager_id',
        'date_affectation',   // ← nom réel de la colonne en BDD
        'commentaire',
    ];

    // (optionnel mais utile)
    protected $casts = [
        'date_affectation' => 'date', // ou 'datetime' selon ton schéma
    ];

    /**
     * Relation vers les détails d'affectation
     */
    public function details()
    {
        return $this->hasMany(DetailAffectation::class, 'affectation_id');
    }

    /**
     * Relation avec le manager responsable
     */
    public function manager()
    {
        return $this->belongsTo(Manager::class, 'manager_id');
    }
}
