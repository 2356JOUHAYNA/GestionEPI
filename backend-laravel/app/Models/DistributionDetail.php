<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DistributionDetail extends Model
{
    use HasFactory;

    protected $fillable = [
        'detail_affectation_id',
        'employe_id',
        'quantite'
    ];

    public function detailAffectation()
    {
        return $this->belongsTo(DetailAffectation::class);
    }

    public function employe()
    {
        return $this->belongsTo(Employe::class);
    }
}
