<?php
// app/Models/FrequenceMateriel.php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FrequenceMateriel extends Model
{
    protected $fillable = ['materiel_id', 'nombre_mois', 'date_debut', 'date_fin'];

    public function materiel()
    {
        return $this->belongsTo(Materiel::class);
    }
}
