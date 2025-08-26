<?php

namespace App\Http\Controllers;

use App\Models\Materiel;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\Taille;

class MaterielController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(Materiel::all());
    }

    public function withTailles()
    {
        return response()->json(Materiel::with('tailles')->get());
    }

    public function withTaillesFiltered(): JsonResponse
    {
        // Version filtrée avec categorie et quantite > 0
        $materiels = Materiel::with([
            'categorie',
            'tailles' => function ($q) {
                $q->select('id', 'materiel_id', 'nom', 'quantite')
                  ->where('quantite', '>', 0)
                  ->orderBy('nom');
            },
        ])->get();

        return response()->json($materiels);
    }

    // Afficher un matériel
    public function show($id)
    {
        $materiel = Materiel::with([
            'categorie',
            'tailles' => function ($q) {
                $q->select('id', 'materiel_id', 'nom', 'quantite')
                  ->where('quantite', '>', 0)
                  ->orderBy('nom');
            },
        ])->find($id);

        if (!$materiel) {
            return response()->json(['message' => 'Matériel non trouvé'], 404);
        }

        return response()->json($materiel);
    }

    // Créer un matériel + tailles optionnelles + mouvement d'entrée initial
    public function store(Request $request)
    {
        $request->validate([
            'nom'                => 'required|string|max:255',
            'stock_initial'      => 'required|integer|min:0',
            'categorie_id'       => 'required|exists:categories,id',
            'tailles'            => 'array',
            'tailles.*'          => [],
            'tailles.*.nom'      => 'sometimes|string|max:50',
            'tailles.*.quantite' => 'sometimes|integer|min:0',
        ]);

        DB::beginTransaction();
        try {
            $materiel = Materiel::create([
                'nom'           => $request->nom,
                'stock_initial' => (int) $request->stock_initial,
                'categorie_id'  => (int) $request->categorie_id,
            ]);

            if ($request->filled('tailles') && is_array($request->tailles)) {
                foreach ($request->tailles as $t) {
                    if (is_array($t)) {
                        $nom = (string) ($t['nom'] ?? '');
                        if ($nom === '') continue;
                        $qte = (int) ($t['quantite'] ?? 0);
                    } else {
                        $nom = (string) $t;
                        if ($nom === '') continue;
                        $qte = 0;
                    }

                    // normalisation simple
                    $nom = is_numeric($nom) ? $nom : mb_strtoupper($nom);

                    Taille::create([
                        'materiel_id' => $materiel->id,
                        'nom'         => $nom,
                        'quantite'    => $qte,
                    ]);
                }
            }

            // Mouvement d'entrée initial —> **IN** + **date_mouvement**
            if ((int) $request->stock_initial > 0) {
                DB::table('stocks')->insert([
                    'materiel_id'    => $materiel->id,
                    'taille_id'      => null,
                    'type_mouvement' => 'IN', // <— PAS "entrée"
                    'quantite'       => (int) $request->stock_initial,
                    'date_mouvement' => now()->toDateString(),
                    'motif'          => 'Stock initial (création matériel)', // ok, ta colonne existe
                    'reference_type' => null,
                    'reference_id'   => null,
                    'created_at'     => now(),
                    'updated_at'     => now(),
                ]);
            }

            DB::commit();
            return response()->json(['message' => 'Matériel créé avec succès.'], 201);

        } catch (\Throwable $e) {
            DB::rollBack();
            return response()->json([
                'error'   => 'Erreur lors de la création',
                'details' => $e->getMessage(),
            ], 500);
        }
    }

    // Mettre à jour un matériel + mouvement d'ajustement si stock_initial change
    // + synchronisation des tailles (create/update/delete)
    public function update(Request $request, $id)
    {
        $materiel = Materiel::findOrFail($id);

        $request->validate([
            'nom'           => 'sometimes|string|max:255',
            'stock_initial' => 'sometimes|integer|min:0',
            'categorie_id'  => 'sometimes|exists:categories,id',

            // tailles optionnelles lors de l'édition
            'tailles'               => 'sometimes|array',
            'tailles.*.id'          => 'sometimes|integer|exists:tailles,id',
            'tailles.*.nom'         => 'sometimes|string|max:50',
            'tailles.*.quantite'    => 'sometimes|integer|min:0',
        ]);

        DB::beginTransaction();
        try {
            $ancienStock = (int) $materiel->stock_initial;

            // 1) MAJ des infos du matériel
            $materiel->update($request->only(['nom', 'stock_initial', 'categorie_id']));

            // 2) Mouvement d'ajustement si le stock initial a changé
            if ($request->filled('stock_initial')) {
                $nouveauStock = (int) $request->stock_initial;
                $delta = $nouveauStock - $ancienStock;

                if ($delta !== 0) {
                    DB::table('stocks')->insert([
                        'materiel_id'    => $materiel->id,
                        'taille_id'      => null,
                        'type_mouvement' => $delta > 0 ? 'IN' : 'OUT', // <— PAS "entrée/sortie"
                        'quantite'       => abs($delta),
                        'date_mouvement' => now()->toDateString(),
                        'motif'          => 'Ajustement via mise à jour du stock initial',
                        'reference_type' => 'AJUSTEMENT_INIT',
                        'reference_id'   => null,
                        'created_at'     => now(),
                        'updated_at'     => now(),
                    ]);
                }
            }

            // 3) Synchronisation des tailles si envoyées
            if ($request->filled('tailles') && is_array($request->tailles)) {
                $payload = collect($request->tailles)
                    ->map(function ($t) {
                        $nom = isset($t['nom']) ? trim((string) $t['nom']) : '';
                        $nom = $nom !== '' ? (is_numeric($nom) ? $nom : mb_strtoupper($nom)) : '';
                        return [
                            'id'       => $t['id'] ?? null,
                            'nom'      => $nom,
                            'quantite' => isset($t['quantite']) ? (int) $t['quantite'] : 0,
                        ];
                    })
                    ->filter(fn ($t) => $t['nom'] !== '');

                // tailles existantes pour ce matériel
                $existantes = $materiel->tailles()->get()->keyBy('id');
                $idsConserves = [];

                foreach ($payload as $t) {
                    if ($t['id'] && $existantes->has($t['id'])) {
                        // update
                        $existantes[$t['id']]->update([
                            'nom'      => $t['nom'],
                            'quantite' => $t['quantite'],
                        ]);
                        $idsConserves[] = $t['id'];
                    } else {
                        // create
                        $nouvelle = Taille::create([
                            'materiel_id' => $materiel->id,
                            'nom'         => $t['nom'],
                            'quantite'    => $t['quantite'],
                        ]);
                        $idsConserves[] = $nouvelle->id;
                    }
                }

                // supprimer les tailles non présentes dans la requête
                if (!empty($idsConserves)) {
                    $materiel->tailles()->whereNotIn('id', $idsConserves)->delete();
                } else {
                    // si la liste reçue est vide (après filtre), on supprime tout
                    $materiel->tailles()->delete();
                }
            }

            DB::commit();
            return response()->json(['message' => 'Matériel mis à jour.']);

        } catch (\Throwable $e) {
            DB::rollBack();
            return response()->json([
                'error'   => 'Erreur lors de la mise à jour',
                'details' => $e->getMessage(),
            ], 500);
        }
    }

    // Supprimer un matériel
    public function destroy($id): JsonResponse
    {
        $materiel = Materiel::findOrFail($id);

        DB::beginTransaction();
        try {
            DB::table('stocks')->where('materiel_id', $materiel->id)->delete();
            $materiel->tailles()->delete();
            $materiel->delete();

            DB::commit();
            return response()->json(['message' => 'Matériel supprimé.']);

        } catch (\Throwable $e) {
            DB::rollBack();
            return response()->json([
                'error'   => 'Erreur lors de la suppression',
                'details' => $e->getMessage(),
            ], 500);
        }
    }

    // ---------------------------- //
    // khaoulaaaaaaaaaaaaaaa
    // ---------------------------- //

    /**
     * Endpoint pour la page "Gestion du stock" :
     * retourne les matériels avec leurs tailles et la QUANTITÉ COURANTE par taille,
     * calculée depuis la table 'stocks' (IN − OUT).
     *
     * URL suggérée : GET /api/epi/materiels/with-tailles-agg
     */
    public function withTaillesAgg(): JsonResponse
    {
        // 1) Matériels
        $materiels = DB::table('materiels')
            ->select('id','nom','stock_initial','categorie_id')
            ->orderBy('nom')
            ->get();

        if ($materiels->isEmpty()) {
            return response()->json([]);
        }

        $ids = $materiels->pluck('id')->all();

        // 2) Tailles par matériel
        $tailles = DB::table('tailles')
            ->whereIn('materiel_id', $ids)
            ->select('id','materiel_id','nom')
            ->orderByRaw('
                CASE WHEN nom REGEXP "^[0-9]+$" THEN 0 ELSE 1 END,
                CASE WHEN nom REGEXP "^[0-9]+$" THEN CAST(nom AS UNSIGNED) END,
                nom
            ')
            ->get();

        // 3) Agrégat mouvements (IN - OUT) par (materiel_id, taille_id)
        $mouvAgg = DB::table('stocks')
            ->whereIn('materiel_id', $ids)
            ->select(
                'materiel_id',
                'taille_id',
                DB::raw("SUM(CASE WHEN type_mouvement = 'IN' THEN quantite ELSE -quantite END) AS qty")
            )
            ->groupBy('materiel_id','taille_id')
            ->get();

        // Index pour lookup rapide
        $aggIndex = [];
        foreach ($mouvAgg as $r) {
            $aggIndex[$r->materiel_id.'#'.($r->taille_id ?? 'null')] = (int) $r->qty;
        }

        // Regrouper tailles par matériel
        $taillesByMateriel = [];
        foreach ($tailles as $t) {
            $taillesByMateriel[$t->materiel_id][] = $t;
        }

        // 4) Construire la réponse
        $out = $materiels->map(function ($m) use ($taillesByMateriel, $aggIndex) {
            $ts = collect($taillesByMateriel[$m->id] ?? [])
                ->map(function ($t) use ($m, $aggIndex) {
                    $key = $m->id.'#'.$t->id;
                    $q   = $aggIndex[$key] ?? 0;
                    return [
                        'id'       => (int) $t->id,
                        'nom'      => $t->nom,
                        'quantite' => (int) $q,
                    ];
                })
                ->values();

            return [
                'id'            => (int) $m->id,
                'nom'           => $m->nom,
                'stock_initial' => (int) ($m->stock_initial ?? 0),
                'categorie_id'  => (int) ($m->categorie_id ?? 0),
                'tailles'       => $ts,
            ];
        });

        return response()->json($out);
    }

    // Retourne les tailles d’un matériel donné (toutes les tailles, même si quantite = 0)
    public function tailles($materielId): JsonResponse
    {
        $materiel = Materiel::with([
            'tailles' => function ($q) {
                // tri: d'abord numériques (38..), puis alphabétiques (S..)
                $q->select('id', 'materiel_id', 'nom', 'quantite')
                  ->orderByRaw('
                    CASE WHEN nom REGEXP "^[0-9]+$" THEN 0 ELSE 1 END,
                    CASE WHEN nom REGEXP "^[0-9]+$" THEN CAST(nom AS UNSIGNED) END,
                    nom
                  ');
            },
        ])->findOrFail($materielId);

        return response()->json(['tailles' => $materiel->tailles]);
    }
}
