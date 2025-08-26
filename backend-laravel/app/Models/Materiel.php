<?php


namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Materiel extends Model
{
    use HasFactory;

    protected $fillable = ['nom', 'categorie_id', 'stock_initial'];

    public function tailles()
    {
        return $this->hasMany(Taille::class);
    }
    public function frequences()
{
    return $this->hasMany(\App\Models\FrequenceMateriel::class, 'materiel_id', 'id');
}
}
