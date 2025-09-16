<?php

namespace App\Services;

use App\Models\Stock;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;
use Carbon\Carbon;

class StockService
{
    /**
     * Stock actuel par (matériel, taille) en se basant UNIQUEMENT sur la table `stocks`.
     * - pas de dépendance à tailles.quantite (absente chez toi)
     * - joint les libellés depuis `materiels` et `tailles`
     */
    public function getStocksActuels()
    {
        // Agrégat mouvements par paire (materiel_id, taille_id)
        $agg = DB::table('stocks')
            ->select([
                'materiel_id',
                'taille_id',
                DB::raw("SUM(
                    CASE
                      WHEN type_mouvement = 'IN'  THEN quantite
                      WHEN type_mouvement = 'OUT' THEN -quantite
                      WHEN type_mouvement = 'ADJ' THEN quantite
                      ELSE 0
                    END
                ) AS stock_actuel"),
            ])
            ->groupBy('materiel_id', 'taille_id');

        // Joindre libellés + inclure aussi les tailles sans mouvement (stock = 0)
        // (LEFT JOIN de tailles vers sous-requête d'agrégat)
        $rows = DB::table('tailles')
            ->join('materiels', 'materiels.id', '=', 'tailles.materiel_id')
            ->leftJoinSub($agg, 'mv', function ($join) {
                $join->on('mv.materiel_id', '=', 'tailles.materiel_id')
                     ->on('mv.taille_id',   '=', 'tailles.id');
            })
            ->select([
                'materiels.id  as materiel_id',
                'materiels.nom as materiel_nom',
                'tailles.id    as taille_id',
                'tailles.nom   as taille_nom',
                DB::raw('COALESCE(mv.stock_actuel, 0) as stock_actuel'),
            ])
            ->orderBy('materiels.nom')
            ->orderBy('tailles.nom')
            ->get();

        return $rows;
    }

    /**
     * Prévisions simples pour le graphe:
     * - moyenne des sorties (OUT) des 3 derniers mois pour la paire demandée
     * - projetée sur les `months` prochains mois (YYYY-MM)
     */
   public function getPrevisions($materielId, $tailleId, $months = 6)
    {
        $months = max(1, (int) $months);

        $start = Carbon::now()->startOfMonth();
        $end   = (clone $start)->addMonthsNoOverflow($months - 1)->endOfMonth();

        $rows = DB::table('previsions_stock as p')
            ->join('materiels as m', 'm.id', '=', 'p.materiel_id')
            ->join('tailles as t', 't.id', '=', 'p.taille_id')
            ->where('p.materiel_id', $materielId)
            ->where('p.taille_id',   $tailleId)
            ->whereBetween('p.periode', [$start->toDateString(), $end->toDateString()])
            ->orderBy('p.periode')
            ->limit($months)
            ->get([
                'p.periode',
                'p.qte_prevue',
                'm.nom as materiel_nom',
                't.nom as taille_nom',
            ]);

        // Map au format attendu par le front
        return $rows->map(function ($r) {
            return [
                'periode'      => \Carbon\Carbon::parse($r->periode)->format('Y-m'),
                'qte_prevue'   => (int) $r->qte_prevue,
                'materiel_nom' => $r->materiel_nom,
                'taille_nom'   => $r->taille_nom,
            ];
        });
    }



    /**
     * Recommandations:
     * - demande_window = sorties (OUT) sur les N DERNIERS mois
     * - a_commander = max(demande_window + safety - stock_actuel, 0)
     */
    public function getRecommandations($months = 2, $safety = 5)
{
    $months = max(1, (int) $months);
    $safety = max(0, (int) $safety);

    $start = Carbon::now()->startOfMonth();
    $end   = (clone $start)->addMonthsNoOverflow($months - 1)->endOfMonth();

    $stocks = $this->getStocksActuels();

    $demandeParPaire = DB::table('previsions_stock')
        ->select('materiel_id', 'taille_id', DB::raw('SUM(qte_prevue) as demande_window'))
        ->whereBetween('periode', [$start->toDateString(), $end->toDateString()])
        ->groupBy('materiel_id', 'taille_id')
        ->get()
        ->keyBy(fn($r) => $r->materiel_id . ':' . $r->taille_id);

    $reco = [];
    foreach ($stocks as $row) {
        $key = $row->materiel_id . ':' . $row->taille_id;
        $demandeWindow = (int) ($demandeParPaire[$key]->demande_window ?? 0);
        $stockActuel   = (int) $row->stock_actuel;
        $toOrder       = max(0, $demandeWindow + $safety - $stockActuel);

        $reco[] = [
            'materiel'        => $row->materiel_nom,
            'taille'          => $row->taille_nom,
            'stock_actuel'    => $stockActuel,
            'demande_window'  => $demandeWindow,
            'a_commander'     => $toOrder,
        ];
    }

    return $reco;
}


    /**
     * Journal des mouvements (utilise ta table `stocks` telle que sur la capture).
     */
    public function move(array $payload): Stock
    {
        $materielId = (int) ($payload['materiel_id'] ?? 0);
        $tailleId   = array_key_exists('taille_id', $payload)
            ? ($payload['taille_id'] === null ? null : (int) $payload['taille_id'])
            : null;
        $type       = $payload['type_mouvement'] ?? null; // 'IN' | 'OUT' | 'ADJ'
        $qty        = (int) ($payload['quantite'] ?? 0);

        if ($materielId <= 0) {
            throw new InvalidArgumentException('materiel_id requis.');
        }
        if (!in_array($type, ['IN', 'OUT', 'ADJ'], true)) {
            throw new InvalidArgumentException('type_mouvement invalide (IN|OUT|ADJ).');
        }
        if ($qty < 1) {
            throw new InvalidArgumentException('quantite doit être >= 1.');
        }

        return DB::transaction(function () use ($payload, $materielId, $tailleId, $type, $qty) {
            $row = new Stock();
            $row->materiel_id    = $materielId;
            $row->taille_id      = $tailleId;
            $row->type_mouvement = $type;
            $row->quantite       = $qty;
            $row->date_mouvement = $payload['date_mouvement'] ?? now()->toDateString();
            $row->motif          = $payload['motif'] ?? null;
            $row->reference_type = $payload['reference_type'] ?? null;
            $row->reference_id   = $payload['reference_id'] ?? null;
            $row->save();

            return $row;
        });
    }
}
