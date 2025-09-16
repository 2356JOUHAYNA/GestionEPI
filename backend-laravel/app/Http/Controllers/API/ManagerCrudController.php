<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\Rule;

use App\Models\Manager;
use App\Models\Employe;

class ManagerCrudController extends Controller
{
    // POST /api/epi/managers  { nom, matricule }
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'nom'       => ['required','string','max:150'],
            'matricule' => ['required','string','max:50', Rule::unique('managers','matricule')],
        ]);

        $m = Manager::create($data);
        return response()->json($m, 201);
    }

    // DELETE /api/epi/managers/{manager}
    public function destroy(Manager $manager): JsonResponse
    {
        if (Employe::where('manager_id', $manager->id)->exists()) {
            return response()->json(['message' => 'Suppression refusée : des employés sont rattachés.'], 409);
        }
        $manager->delete();
        return response()->json(['message' => 'Manager supprimé.']);
    }

    // POST /api/epi/managers/{manager}/employes  { matricule } OU { employe_id }
    public function attach(Manager $manager, Request $request): JsonResponse
    {
        $request->validate([
            'matricule'  => ['nullable','string'],
            'employe_id' => ['nullable','integer','exists:employes,id'],
        ]);

        if ($request->filled('matricule')) {
            $emp = Employe::where('matricule', $request->matricule)->first();
            if (!$emp) return response()->json(['message' => 'Employé introuvable (matricule).'], 404);
            $emp->update(['manager_id' => $manager->id]);
            return response()->json(['message' => 'Employé ajouté à l’équipe.']);
        }

        if ($request->filled('employe_id')) {
            $emp = Employe::find($request->employe_id);
            $emp->update(['manager_id' => $manager->id]);
            return response()->json(['message' => 'Employé ajouté à l’équipe.']);
        }

        return response()->json(['message' => 'Fournir matricule ou employe_id.'], 422);
    }

    // DELETE /api/epi/managers/{manager}/employes/{employe}
    public function detach(Manager $manager, Employe $employe): JsonResponse
    {
        if ($employe->manager_id !== $manager->id) {
            return response()->json(['message' => 'Cet employé n’appartient pas à ce manager.'], 404);
        }
        $employe->update(['manager_id' => null]);
        return response()->json(['message' => 'Employé retiré de l’équipe.']);
    }


    public function update(Request $request, Manager $manager): JsonResponse
{
    $data = $request->validate([
        'nom'       => ['required','string','max:150'],
        // unicité du matricule en ignorant l’enregistrement courant
        'matricule' => ['required','string','max:50', Rule::unique('managers','matricule')->ignore($manager->id)],
    ]);

    $manager->update($data);

    return response()->json($manager->fresh(), 200);
}
}
