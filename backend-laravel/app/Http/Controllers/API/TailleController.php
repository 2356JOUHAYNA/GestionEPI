<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Taille;

class TailleController extends Controller
{
    public function getByMateriel($id)
    {
        return response()->json(Taille::where('materiel_id', $id)->get());
    }
}
