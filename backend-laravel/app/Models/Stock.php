<?php
// app/Models/Stock.php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Stock extends Model
{
    protected $fillable = [
        'materiel_id','type_mouvement','quantite','date_mouvement','motif',
        'reference_type','reference_id',
    ];

    const IN  = 'IN';
    const OUT = 'OUT';
    const ADJ = 'ADJ';

    public function materiel()
    {
        return $this->belongsTo(Materiel::class);
    }

    public function scopeForMateriel($q, $materielId)
    {
        return $q->where('materiel_id', $materielId);
    }
}
