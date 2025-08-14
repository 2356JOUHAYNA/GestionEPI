<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DetailAffectation extends Model
{
    use HasFactory;

    protected $fillable = [
        'affectation_id', 'materiel_id', 'taille_id', 'quantite',
    ];

    /**
     * Relation avec le matériel.
     */
    public function materiel()
    {
        return $this->belongsTo(Materiel::class, 'materiel_id');
    }

    /**
     * Relation avec la taille.
     */
    public function taille()
    {
        return $this->belongsTo(Taille::class, 'taille_id');
    }

    /**
     * Relation avec l'affectation.
     */
    public function affectation()
    {
        return $this->belongsTo(Affectation::class, 'affectation_id');
    }
}
