<?php
namespace App\Http\Controllers;

use App\Models\Employe;
use Illuminate\Http\JsonResponse;
use App\Models\Affectation;

class EmployeController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(Employe::all());
    }
    public function getAffectationsByMatricule($matricule)
{
    $employe = Employe::where('matricule', $matricule)->first();

    if (!$employe) {
        return response()->json(['message' => 'Employé non trouvé'], 404);
    }

    $affectations = Affectation::with(['details.materiel', 'details.taille'])
        ->where('employe_id', $employe->id)
        ->get();

    return response()->json([
        'employe_id' => $employe->id,
        'nom' => $employe->nom,
        'fonction' => $employe->fonction->nom ?? '',
        'affectations' => $affectations
    ]);
}

}

