<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

use App\Models\Materiel;
use App\Models\Taille;
use App\Models\Stock;

class MaterielCrudController extends Controller
{
    /**
     * GET /api/epi/materiels/with-tailles
     * Retourne les matériels + tailles pour remplir les listes côté UI.
     */
    public function indexWithTailles(): JsonResponse
    {
        $materiels = Materiel::with(['categorie:id,nom', 'tailles:id,materiel_id,nom'])
            ->orderBy('nom')
            ->get();

        return response()->json($materiels);
    }

    /**
     * POST /api/epi/materiels/full
     * Payload:
     * {
     *   "nom": "Chaussure de sécurité",
     *   "categorie_id": 3,          // optionnel
     *   "tailles": [
     *      {"nom": "38", "quantite": 5},   // quantite optionnelle (stock initial)
     *      {"nom": "39"},
     *      {"nom": "40", "quantite": 2}
     *   ]
     * }
     */
    public function storeFull(Request $request): JsonResponse
    {
        $data = $request->validate([
            'nom'                 => ['required','string','max:150', Rule::unique('materiels','nom')],
            'categorie_id'        => ['nullable','integer','exists:categories,id'],
            'tailles'             => ['required','array','min:1'],
            'tailles.*.nom'       => ['required','string','max:30'],
            'tailles.*.quantite'  => ['nullable','integer','min:0'],
        ],[
            'nom.unique'          => 'Ce matériel existe déjà.',
            'tailles.required'    => 'Ajoute au moins une taille.',
        ]);

        // Dédupliquer les tailles si l'UI envoie des doublons
        $taillesUniques = [];
        foreach ($data['tailles'] as $t) {
            $key = mb_strtoupper(trim($t['nom']));
            $taillesUniques[$key] = [
                'nom'      => $key,
                'quantite' => isset($t['quantite']) ? (int) $t['quantite'] : null,
            ];
        }
        $tailles = array_values($taillesUniques);

        $created = DB::transaction(function () use ($data, $tailles) {

            // 1) Créer le matériel
            $materiel = Materiel::create([
                'nom'            => $data['nom'],
                'categorie_id'   => $data['categorie_id'] ?? null,
                // si ta colonne n'existe pas, elle sera ignorée par Eloquent
                'stock_initial'  => 0,
            ]);

            // 2) Créer les tailles
            $tailleRows = [];
            foreach ($tailles as $t) {
                $tailleRows[] = Taille::create([
                    'materiel_id' => $materiel->id,
                    'nom'         => $t['nom'],
                    // ne stocke pas la quantité ici si tu veux que la vérité soit dans `stocks`
                    // 'quantite'  => $t['quantite'] ?? 0,
                ]);
            }

            // 3) Stock initial (optionnel) → table `stocks`
            // IMPORTANT: on renseigne aussi `date_mouvement` pour éviter l'erreur 1364.
            // `now()` convient pour DATETIME/TIMESTAMP et sera aussi accepté par un champ DATE.
            foreach ($tailleRows as $idx => $tailleModel) {
                $q = $tailles[$idx]['quantite'] ?? null;
                if ($q !== null) {
                    Stock::updateOrCreate(
                        [
                            'materiel_id' => $materiel->id,
                            'taille_id'   => $tailleModel->id,
                        ],
                        [
                            'quantite'       => (int) $q,
                            'date_mouvement' => now(), // si ta colonne est DATE, MySQL prendra la partie date
                        ]
                    );
                } else {
                    // Si tu veux créer la ligne même à 0 pour l'afficher dans "Stocks", décommente :
                    // Stock::firstOrCreate(
                    //   ['materiel_id' => $materiel->id, 'taille_id' => $tailleModel->id],
                    //   ['quantite' => 0, 'date_mouvement' => now()]
                    // );
                }
            }

            return $materiel->load(['categorie:id,nom', 'tailles:id,materiel_id,nom']);
        });

        return response()->json($created, 201);
    }
}
