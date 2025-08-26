<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;

class ChatController extends Controller
{
    private function lower($s) { return mb_strtolower(trim((string)$s), 'UTF-8'); }

    private function materielSuggestions(string $term, int $limit = 5): array
    {
        if (!Schema::hasTable('materiels')) return [];
        $all = DB::table('materiels')->pluck('nom')->all();
        $scored = [];
        foreach ($all as $n) {
            $score = 0;
            similar_text($this->lower($n), $term, $score);
            $scored[] = ['nom' => $n, 'score' => $score];
        }
        usort($scored, fn($a,$b) => $b['score'] <=> $a['score']);
        return array_slice(array_column($scored, 'nom'), 0, $limit);
    }

    private function findMaterielOrSuggest(string $term, int $threshold = 80): array
    {
        if (!Schema::hasTable('materiels')) {
            return ['error' => "Table 'materiels' absente. Lance les migrations."];
        }
        $t = $this->lower($term);

        $materiel = DB::table('materiels')
            ->whereRaw('LOWER(nom) LIKE ?', ['%'.$t.'%'])
            ->first();
        if ($materiel) return ['materiel' => $materiel];

        $sug = $this->materielSuggestions($t);
        if (!empty($sug)) {
            $best = $sug[0]; $score = 0;
            similar_text($t, $this->lower($best), $score);
            if ($score >= $threshold) {
                $materiel = DB::table('materiels')
                    ->whereRaw('LOWER(nom) = ?', [$this->lower($best)])
                    ->first();
                if ($materiel) return ['materiel' => $materiel];
            }
            return ['error' => "Matériel introuvable. As-tu voulu dire : ".implode(', ', $sug)." ?"];
        }
        return ['error' => "Matériel introuvable."];
    }

    public function handle(Request $req)
    {
        try {
            $msg = trim((string)$req->input('message',''));
            if ($this->lower($msg) === 'ping') return response()->json(['reply' => 'pong']);

            if ($msg === '') {
                return response()->json([
                    'reply' => "Bonjour 👋 Je peux répondre à :\n".
                               "• stock <materiel> <taille>\n".
                               "• prévision <materiel> <taille> <mois>\n".
                               "• à commander <mois> [sécurité X]"
                ]);
            }

            $m = $this->lower($msg);

            /* ========== 1) STOCK <materiel> <taille> ========== */
            if (preg_match('/^\s*(stock|stk)\s+(.+?)\s+([a-z0-9\-\+]+)\s*$/iu', $m, $g)) {
                $materielTerm = $this->lower($g[2]);
                $tailleTerm   = $this->lower($g[3]);

                $found = $this->findMaterielOrSuggest($materielTerm);
                if (isset($found['error'])) return response()->json(['reply' => $found['error']]);
                $materiel = $found['materiel'];

                if (!Schema::hasTable('tailles'))
                    return response()->json(['reply' => "Table 'tailles' absente."]);

                // ➜ ta table a 'nom' (pas libelle/code)
                $taille = DB::table('tailles')
                    ->where('materiel_id', $materiel->id)
                    ->whereRaw('LOWER(nom) LIKE ?', ["%{$tailleTerm}%"])
                    ->first();

                if (!$taille) {
                    $list = DB::table('tailles')->where('materiel_id', $materiel->id)->pluck('nom')->all();
                    if (empty($list)) return response()->json(['reply' => "Aucune taille définie pour {$materiel->nom}."]);
                    return response()->json(['reply' => "Taille introuvable pour {$materiel->nom}. Tailles disponibles : ".implode(', ', $list)]);
                }

                // Stock: pas de colonne quantite → base = 0, + mouvements si table 'stocks' existe
                $stockBase = 0;
                $delta = 0;
                if (Schema::hasTable('stocks')) {
                    $delta = (int) (DB::table('stocks')
                        ->selectRaw('SUM(CASE
                          WHEN type_mouvement="IN"  THEN quantite
                          WHEN type_mouvement="OUT" THEN -quantite
                          WHEN type_mouvement="ADJ" THEN quantite
                          ELSE 0 END) as delta')
                        ->where('materiel_id', $materiel->id)
                        ->where('taille_id',   $taille->id)
                        ->value('delta') ?? 0);
                }
                $stock = $stockBase + $delta;

                return response()->json(['reply' => "Stock actuel de {$materiel->nom} {$taille->nom} : {$stock}"]);
            }

            /* ========== 2) PRÉVISION <materiel> <taille> <mois> ========== */
            if (preg_match('/^\s*(prévision|prevision|prev|forecast)\s+(.+?)\s+([a-z0-9\-\+]+)\s+(\d+)\s*mois\s*$/iu', $m, $g)) {
                $materielTerm = $this->lower($g[2]);
                $tailleTerm   = $this->lower($g[3]);
                $months       = (int)$g[4];

                $found = $this->findMaterielOrSuggest($materielTerm);
                if (isset($found['error'])) return response()->json(['reply' => $found['error']]);
                $materiel = $found['materiel'];

                if (!Schema::hasTable('tailles'))
                    return response()->json(['reply' => "Table 'tailles' absente."]);

                $taille = DB::table('tailles')
                    ->where('materiel_id', $materiel->id)
                    ->whereRaw('LOWER(nom) LIKE ?', ["%{$tailleTerm}%"])
                    ->first();

                if (!$taille) {
                    $list = DB::table('tailles')->where('materiel_id', $materiel->id)->pluck('nom')->all();
                    if (empty($list)) return response()->json(['reply' => "Aucune taille définie pour {$materiel->nom}."]);
                    return response()->json(['reply' => "Taille introuvable pour {$materiel->nom}. Tailles disponibles : ".implode(', ', $list)]);
                }

                if (!Schema::hasTable('previsions_stock')) {
                    return response()->json(['reply' => "Table 'previsions_stock' absente."]);
                }

                $rows = DB::table('previsions_stock')
                    ->where('materiel_id', $materiel->id)
                    ->where('taille_id',   $taille->id)
                    ->orderBy('periode')
                    ->limit($months)
                    ->get(['periode','qte_prevue','qte_inf','qte_sup','modele']);

                if ($rows->isEmpty()) {
                    return response()->json(['reply' => "Pas de prévisions pour {$materiel->nom} {$taille->nom}."]);
                }

                $txt = "Prévisions {$materiel->nom} {$taille->nom} (prochains {$months} mois):\n";
                foreach ($rows as $r) {
                    $p = substr((string)$r->periode, 0, 7);
                    $txt .= "- {$p}: {$r->qte_prevue}";
                    if (!is_null($r->qte_inf) && !is_null($r->qte_sup)) $txt .= " [{$r->qte_inf}–{$r->qte_sup}]";
                    if (!empty($r->modele)) $txt .= " ({$r->modele})";
                    $txt .= "\n";
                }
                return response()->json(['reply' => $txt]);
            }

            /* ========== 3) A COMMANDER <mois> [sécurité X] ========== */
            if (preg_match('/^\s*(a|à)\s*commander\s+(\d+)\s*mois(?:.*?(securite|sécurité)\s*(\d+))?\s*$/iu', $m, $g)) {
                $months = (int)$g[2];
                $safety = isset($g[4]) ? (int)$g[4] : 5;

                $url  = url("/api/epi/reco-appro?months={$months}&safety={$safety}");
                $json = @file_get_contents($url);
                $data = $json ? json_decode($json, true) : [];

                if (!is_array($data) || empty($data)) {
                    return response()->json(['reply' => "Aucune reco pour {$months} mois (sécurité {$safety})."]);
                }

                $top = array_slice($data, 0, 5);
                $txt = "À commander (fenêtre {$months}, sécurité {$safety}) :\n";
                foreach ($top as $r) {
                    $txt .= "- {$r['materiel']} {$r['taille']}: {$r['a_commander']} (stock {$r['stock_actuel']}, demande {$r['demande_window']})\n";
                }
                return response()->json(['reply' => $txt]);
            }

            // Aide par défaut
            return response()->json([
                'reply' => "Je peux répondre à :\n".
                           "• stock <materiel> <taille>  (ex: stock chaussure M)\n".
                           "• prévision <materiel> <taille> <mois>  (ex: prévision chaussure M 3 mois)\n".
                           "• à commander <mois> [sécurité X]  (ex: à commander 2 mois sécurité 5)"
            ]);
        } catch (\Throwable $e) {
            Log::error('[CHATBOT] '.$e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return response()->json(['reply' => "Erreur interne côté API (chat) : ".$e->getMessage()]);
        }
    }
}
