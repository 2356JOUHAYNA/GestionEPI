<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FrequenceMateriel extends Model
{
    // 👈 nom EXACT de la table de ta capture
    protected $table = 'frequences_materiels';

    public $timestamps = false;

    protected $fillable = ['materiel_id', 'nombre_mois', 'date_debut', 'date_fin'];

    protected $casts = [
        'date_debut' => 'date',
        'date_fin'   => 'date',
    ];

    public function materiel()
    {
        return $this->belongsTo(Materiel::class, 'materiel_id', 'id');
    }
}
