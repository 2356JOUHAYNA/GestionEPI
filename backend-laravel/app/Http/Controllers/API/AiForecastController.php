<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\AiForecastClient;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\JsonResponse;

class AiForecastController extends Controller
{
    public function __construct(private AiForecastClient $ai) {}

    public function health(): JsonResponse
    {
        return response()->json($this->ai->health());
    }

    /**
     * Deux modes :
     *  A) Passe-plat : payload { series: [...], horizon_months }
     *  B) Depuis la BDD : { from_db: true, materiel_ids?, taille_ids?, months, horizon_months }
     */
    public function forecast(Request $req): JsonResponse
    {
        $req->validate([
            'horizon_months' => ['nullable', 'integer', 'min:1', 'max:24'],
            'series'         => ['nullable', 'array'],
            'from_db'        => ['nullable', 'boolean'],
            'materiel_ids'   => ['nullable', 'array'],
            'taille_ids'     => ['nullable', 'array'],
            'months'         => ['nullable', 'integer', 'min:6', 'max:48'],
        ]);

        // ============================
        // ===== Mode BDD (MySQL) =====
        // ============================
        if ($req->boolean('from_db')) {
            // Table attendue: stocks(materiel_id, taille_id, type_mouvement, quantite, date_mouvement)
            $months      = max((int) $req->integer('months', 12), 6);
            $materielIds = $req->input('materiel_ids', []);
            $tailleIds   = $req->input('taille_ids', []);

            // Fenêtre: mois complets
            $start = now()->startOfMonth()->subMonths($months - 1)->toDateString();
            $end   = now()->endOfMonth()->toDateString();

            // Demande = sorties 'OUT' (adapte IN/ADJ si besoin)
            $q = DB::table('stocks')
                ->selectRaw("
                    materiel_id,
                    taille_id,
                    DATE_FORMAT(date_mouvement, '%Y-%m-01') AS ds,
                    SUM(CASE WHEN type_mouvement = 'OUT' THEN quantite ELSE 0 END) AS y
                ")
                ->whereBetween('date_mouvement', [$start, $end])
                ->groupBy('materiel_id', 'taille_id', 'ds')
                ->orderBy('ds');

            if (!empty($materielIds)) {
                $q->whereIn('materiel_id', $materielIds);
            }
            if (!empty($tailleIds)) {
                $q->whereIn('taille_id', $tailleIds);
            }

            $rows = $q->get();

            // Liste des mois de la fenêtre (YYYY-MM-01)
            $allMonths = collect(range(0, $months - 1))
                ->map(fn ($i) => now()->startOfMonth()->subMonths($months - 1 - $i)->format('Y-m-01'));

            // Groupé par paire (materiel_id, taille_id)
            $byKey = $rows->groupBy(fn ($r) => $r->materiel_id . '#' . ($r->taille_id ?? 'null'));

            // Combinaisons cibles:
            // - si des IDs sont fournis -> on force une série pour chaque combo même sans lignes
            // - sinon -> on prend celles trouvées en BDD
            $targetCombos = [];
            if (!empty($materielIds)) {
                if (!empty($tailleIds)) {
                    foreach ($materielIds as $mid) {
                        foreach ($tailleIds as $tid) {
                            $targetCombos[] = [(int) $mid, (int) $tid];
                        }
                    }
                } else {
                    foreach ($materielIds as $mid) {
                        $targetCombos[] = [(int) $mid, null];
                    }
                }
            } else {
                foreach ($byKey as $key => $_) {
                    [$mid, $tid] = explode('#', $key);
                    $targetCombos[] = [(int) $mid, $tid === 'null' ? null : (int) $tid];
                }
            }

            // Construire les séries (mois manquants = 0)
            $series = [];
            foreach ($targetCombos as [$mid, $tid]) {
                $key   = $mid . '#' . ($tid ?? 'null');
                $items = $byKey[$key] ?? collect();
                $map   = collect($items)->keyBy('ds');

                $points = $allMonths->map(fn ($ds) => [
                    'ds' => $ds,
                    'y'  => (int) ($map[$ds]->y ?? 0),
                ])->all();

                $series[] = [
                    'materiel_id' => $mid,
                    'taille_id'   => $tid,
                    'points'      => $points,
                ];
            }

            // Aucun ID et aucune ligne trouvée -> note informative
            if (empty($series)) {
                return response()->json([
                    'forecasts' => [],
                    'note'      => 'Aucune donnée trouvée pour les filtres/fenêtre demandés.',
                ]);
            }

            $payload = [
                'series'         => $series,
                'horizon_months' => (int) $req->integer('horizon_months', 6),
            ];

            try {
                return response()->json($this->ai->forecast($payload));
            } catch (\Throwable $e) {
                \Log::error('AI forecast (from_db) error', ['msg' => $e->getMessage()]);
                return response()->json([
                    'forecasts' => [],
                    'error'     => 'AI service error: ' . $e->getMessage(),
                ], 502);
            }
        }

        // ============================
        // ===== Mode passe-plat  =====
        // ============================
        $payload = [
            'series'         => $req->input('series', []),
            'horizon_months' => (int) $req->integer('horizon_months', 6),
        ];

        if (empty($payload['series'])) {
            return response()->json([
                'forecasts' => [],
                'note'      => 'Aucune série fournie (mode passe-plat).',
            ]);
        }

        try {
            return response()->json($this->ai->forecast($payload));
        } catch (\Throwable $e) {
            \Log::error('AI forecast (passthrough) error', ['msg' => $e->getMessage()]);
            return response()->json([
                'forecasts' => [],
                'error'     => 'AI service error: ' . $e->getMessage(),
            ], 502);
        }
    }
}
