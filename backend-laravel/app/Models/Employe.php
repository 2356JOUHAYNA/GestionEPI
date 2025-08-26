<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Employe extends Model
{
    protected $table = 'employes'; // nom de ta table

    // khaoula — Ajout 1 : champs autorisés en écriture (mass assignment)
    protected $fillable = ['nom', 'matricule', 'manager_id', 'fonction_id'];

    public function manager()
    {
        return $this->belongsTo(Manager::class);
    }

    // khaoula — Ajout 2 : relation vers la fonction de l’employé
    public function fonction()
    {
        return $this->belongsTo(Fonction::class);
    }
}
