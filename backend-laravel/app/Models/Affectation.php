<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Affectation extends Model
{
    use HasFactory;

    protected $fillable = [
        'manager_id', 
        'date',
        'commentaire',
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
