<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\Rule;

use App\Models\Employe;
use App\Models\Affectation;

class EmployeCrudController extends Controller
{
    // POST /api/epi/employes
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'nom'         => ['required', 'string', 'max:150'],
            'matricule'   => ['required', 'string', 'max:50', Rule::unique('employes', 'matricule')],
            'manager_id'  => ['nullable', 'integer', 'exists:managers,id'],
            'fonction_id' => ['nullable', 'integer', 'exists:fonctions,id'],
        ]);

        $e = new Employe();
        $e->nom         = $data['nom'];
        $e->matricule   = $data['matricule'];
        $e->manager_id  = $data['manager_id']  ?? null;
        $e->fonction_id = $data['fonction_id'] ?? null;
        $e->save();

        return response()->json($e, 201);
    }

    // PUT /api/epi/employes/{employe}
    public function update(Employe $employe, Request $request): JsonResponse
    {
        $data = $request->validate([
            'nom'         => ['required', 'string', 'max:150'],
            'matricule'   => ['required', 'string', 'max:50', Rule::unique('employes', 'matricule')->ignore($employe->id)],
            'manager_id'  => ['nullable', 'integer', 'exists:managers,id'],
            'fonction_id' => ['nullable', 'integer', 'exists:fonctions,id'],
        ]);

        $employe->nom         = $data['nom'];
        $employe->matricule   = $data['matricule'];
        $employe->manager_id  = $data['manager_id']  ?? null;
        $employe->fonction_id = $data['fonction_id'] ?? null;
        $employe->save();

        return response()->json($employe);
    }

    // DELETE /api/epi/employes/{employe}
    public function destroy(Employe $employe): JsonResponse
    {
        // Sécurité: refuse si des affectations existent
        if (Affectation::where('employe_id', $employe->id)->exists()) {
            return response()->json(['message' => 'Suppression refusée : cet employé possède des affectations.'], 409);
        }

        $employe->delete();
        return response()->json(['message' => 'Employé supprimé.']);
    }
}
