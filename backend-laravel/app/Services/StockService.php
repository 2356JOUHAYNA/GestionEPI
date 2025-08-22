<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;

class StockService
{
    /**
     * Calcule le stock actuel par (matériel, taille).
     */
    public function getStocksActuels()
    {
        return DB::table('tailles')
            ->join('materiels', 'materiels.id', '=', 'tailles.materiel_id')
            ->select('materiels.nom as materiel_nom','tailles.id as taille_id','tailles.nom as taille_nom')
            ->selectRaw('
                (COALESCE(tailles.quantite,0) + COALESCE((
                    SELECT SUM(
                        CASE
                          WHEN type_mouvement = \'IN\'  THEN quantite
                          WHEN type_mouvement = \'OUT\' THEN -quantite
                          WHEN type_mouvement = \'ADJ\' THEN quantite
                          ELSE 0
                        END
                    )
                    FROM stocks s
                    WHERE s.materiel_id = tailles.materiel_id
                      AND s.taille_id   = tailles.id
                ),0)) AS stock_actuel
            ')
            ->get();
    }

    /**
     * Récupère les prévisions de la table previsions_stock.
     */
    public function getPrevisions($materielId, $tailleId, $months = 6)
    {
        return DB::table('previsions_stock')
            ->where('materiel_id', $materielId)
            ->where('taille_id', $tailleId)
            ->orderBy('periode')
            ->limit($months)
            ->get();
    }

    /**
     * Génère recommandations d’approvisionnement
     */
    public function getRecommandations($months = 2, $safety = 5)
    {
        $stocks = $this->getStocksActuels();

        $reco = [];

        foreach ($stocks as $row) {
            // Demande future = somme des prévisions sur la fenêtre
            $demande = DB::table('previsions_stock')
                ->where('materiel_id', $row->materiel_id)
                ->where('taille_id', $row->taille_id)
                ->orderBy('periode')
                ->limit($months)
                ->sum('qte_prevue');

            $qtyToOrder = max(0, $demande + $safety - $row->stock_actuel);

            $reco[] = [
                'materiel'   => $row->materiel_nom,
                'taille'     => $row->taille_nom,
                'stock_actuel' => $row->stock_actuel,
                'demande'    => $demande,
                'stock_securite' => $safety,
                'a_commander' => $qtyToOrder,
            ];
        }

        return $reco;
    }
}
