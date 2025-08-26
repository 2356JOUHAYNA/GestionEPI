<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Distribution extends Model
{
    protected $fillable = [
        'employe_id',
        'affectation_id',
        'detail_id',
        'materiel_id',
        'taille_id',
        'quantite',
        'trace_mois',
        'date_distribution',
    ];

    protected $casts = [
        'trace_mois' => 'array',
        'date_distribution' => 'date',
    ];

    // Relations utiles (facultatif mais pratique)
    public function employe()      { return $this->belongsTo(Employe::class); }
    public function affectation()  { return $this->belongsTo(Affectation::class); }
    public function detail()       { return $this->belongsTo(DetailAffectation::class, 'detail_id'); }
    public function materiel()     { return $this->belongsTo(Materiel::class); }
    public function taille()       { return $this->belongsTo(Taille::class); }
}
