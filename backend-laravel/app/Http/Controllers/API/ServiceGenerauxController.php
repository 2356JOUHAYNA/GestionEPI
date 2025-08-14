<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Employe;
use App\Models\Affectation;
use App\Models\DetailAffectation;

class ServiceGenerauxController extends Controller
{
    // /api/epi/employes/{matricule}
    public function getEmployeByMatricule($matricule)
    {
        $employe = Employe::with(['manager', 'manager.employes:id,nom,prenom,matricule,manager_id'])
            ->where('matricule', $matricule)
            ->firstOrFail();

        return response()->json([
            'id' => $employe->id,
            'matricule' => $employe->matricule,
            'nom' => $employe->nom,
            'prenom' => $employe->prenom,
            'fonction' => $employe->fonction ?? null,
            'manager' => $employe->manager ? [
                'id' => $employe->manager->id,
                'nom' => $employe->manager->nom,
            ] : null,
            // collègues du même manager pour la liste déroulante
            'manager_employes' => $employe->manager
                ? $employe->manager->employes->map(fn($e) => [
                    'id' => $e->id,
                    'matricule' => $e->matricule,
                    'nom' => $e->nom,
                    'prenom' => $e->prenom,
                ])->values()
                : [],
        ]);
    }

    // /api/epi/employes/{matricule}/manager-affectations
    public function getManagerAffectations($matricule)
    {
        $employe = Employe::where('matricule', $matricule)->firstOrFail();
        if (!$employe->manager_id) return response()->json([]);

        $affectations = Affectation::with(['details.materiel', 'details.taille'])
            ->where('manager_id', $employe->manager_id)
            ->orderBy('date', 'desc')
            ->get();

        // ici tu peux calculer quantite_restante si tu as des distributions déjà faites
        return response()->json($affectations);
    }

    // DELETE detail
    public function deleteDetail($affectationId, $detailId)
    {
        $detail = DetailAffectation::where('id', $detailId)
            ->where('affectation_id', $affectationId)
            ->firstOrFail();

        $detail->delete();
        return response()->json(['message' => 'Detail supprimé.']);
    }
}
