<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Materiel;
use App\Models\Taille;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request; // ⬅️ IMPORTANT : la Request de Laravel

class TailleController extends Controller
{
    // ----- code de ta copine : NE PAS TOUCHER -----

    public function getByMateriel($id)
    {
        return response()->json(Taille::where('materiel_id', $id)->get());
    }

    // ➕ Ta version avec route model binding (plus propre)
    public function getByMaterielBound(Materiel $materiel): JsonResponse
    {
        $tailles = $materiel->tailles()
            ->select('id', 'materiel_id', 'nom', 'quantite')
            ->orderBy('nom')
            ->get();

        return response()->json($tailles);
    }

    // ➕ Variante filtrée (quantité > 0)
    public function getByMaterielFiltered(Materiel $materiel): JsonResponse
    {
        $tailles = $materiel->tailles()
            ->select('id', 'materiel_id', 'nom', 'quantite')
            ->where('quantite', '>', 0)
            ->orderBy('nom')
            ->get();

        return response()->json($tailles);
    }

    // ------------------------- khaoulaaaaa -------------------------

    // ▶︎ Tailles GLOBALLES (depuis la table `tailles`, sans filtrer par matériel)
    // GET /api/epi/tailles?available=1   (optionnel: only quantite > 0)
    public function indexGlobal(): JsonResponse
    {
        $onlyAvailable = (int) request('available', 0) === 1;

        $rows = Taille::query()
            ->when($onlyAvailable, fn ($q) => $q->where('quantite', '>', 0))
            ->select('id', 'nom')
            // tri numérique pour 9,10,11,... sinon alpha
            ->orderByRaw('CASE WHEN nom REGEXP "^[0-9]+$" THEN CAST(nom AS UNSIGNED) ELSE 999999 END, nom')
            ->get();

        return response()->json($rows);
    }

    // ▶︎ Recherche globale dans `tailles`
    // GET /api/epi/tailles/search?q=1&available=1
    public function searchGlobal(): JsonResponse
    {
        $term          = trim((string) request('q', ''));
        $onlyAvailable = (int) request('available', 0) === 1;

        $rows = Taille::query()
            ->when($onlyAvailable, fn ($q) => $q->where('quantite', '>', 0))
            ->when($term !== '', fn ($q) => $q->where('nom', 'like', "%{$term}%"))
            ->select('id', 'nom')
            ->orderByRaw('CASE WHEN nom REGEXP "^[0-9]+$" THEN CAST(nom AS UNSIGNED) ELSE 999999 END, nom')
            ->get();

        return response()->json($rows);
    }

    // ▶︎ Tailles PAR MATERIEL (tu peux l'utiliser quand tu veux filtrer)
    public function byMateriel(Materiel $materiel): JsonResponse
    {
        $tailles = Taille::where('materiel_id', $materiel->id)
            ->select('id', 'nom', 'materiel_id', 'quantite')
            ->orderByRaw('CASE WHEN nom REGEXP "^[0-9]+$" THEN CAST(nom AS UNSIGNED) ELSE 999999 END, nom')
            ->get();

        return response()->json($tailles);
    }

    // ▶︎ CRUD tailles

    // POST /api/epi/tailles
    public function store(Request $r): JsonResponse
    {
        $data = $r->validate([
            'materiel_id' => 'required|integer|exists:materiels,id',
            'nom'         => 'required|string|max:191',
            'quantite'    => 'nullable|integer|min:0',
        ]);

        $t = Taille::create($data);
        return response()->json($t, 201);
    }

    // PUT /api/epi/tailles/{taille}
    public function update(Request $r, Taille $taille): JsonResponse
    {
        $data = $r->validate([
            'nom'      => 'required|string|max:191',
            'quantite' => 'nullable|integer|min:0',
        ]);

        $taille->update($data);
        return response()->json($taille);
    }

    // DELETE /api/epi/tailles/{taille}
    public function destroy(Taille $taille): JsonResponse
    {
        $taille->delete();
        return response()->json(['ok' => true]);
    }
}
