<?php
// app/Console/Commands/GenerateForecasts.php
namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Carbon\Carbon;

class GenerateForecasts extends Command
{
    protected $signature = 'forecast:generate {--months=24} {--horizon=6}';
    protected $description = 'Génère les prévisions de demande par (materiel, taille)';

    public function handle()
    {
        $months  = (int)$this->option('months');   // historique utilisé
        $horizon = (int)$this->option('horizon');  // nb de mois à prédire

        $start = now()->startOfMonth()->copy()->subMonths($months);
        $end   = now()->startOfMonth();

        // 1) Lire la vue (agrégée par mois)
        $rows = DB::table('demande_mensuelle_materiel_taille')
            ->whereBetween('periode', [$start->toDateString(), $end->toDateString()])
            ->orderBy('materiel_id')->orderBy('taille_id')->orderBy('periode')
            ->get();

        if ($rows->isEmpty()) {
            $this->warn('Aucune série à traiter.');
            return self::SUCCESS;
        }

        // 2) Groupage par (materiel, taille) & complétion des mois manquants (=0)
        $series = [];
        $grouped = $rows->groupBy(fn($r) => $r->materiel_id.'|'.($r->taille_id ?? 'null'));

        foreach ($grouped as $key => $grp) {
            [$mat, $taille] = explode('|', $key);

            $map = [];
            foreach ($grp as $g) {
                $map[(string)$g->periode] = (int)$g->qte_sortie;
            }

            $points = [];
            $cursor = $start->copy();
            while ($cursor <= $end) {
                $ds = $cursor->toDateString(); // YYYY-MM-01
                $points[] = ['ds' => $ds, 'y' => $map[$ds] ?? 0];
                $cursor->addMonth();
            }

            $series[] = [
                'materiel_id' => (int)$mat,
                'taille_id'   => $taille === 'null' ? null : (int)$taille,
                'points'      => $points,
            ];
        }

        // 3) Appel microservice IA
        $resp = Http::timeout(120)
            // ->withHeader('X-API-Key', env('AI_API_KEY'))  // si tu as activé la clé
            ->post(env('AI_URL').'/forecast', [
                'series' => $series,
                'horizon_months' => $horizon,
            ])->json();

        if (!is_array($resp) || !isset($resp['forecasts'])) {
            $this->error('Réponse IA invalide');
            return self::FAILURE;
        }

        // 4) Upsert dans previsions_stock
        $count = 0;
        foreach ($resp['forecasts'] as $f) {
            DB::table('previsions_stock')->updateOrInsert(
                [
                    'materiel_id' => (int)$f['materiel_id'],
                    'taille_id'   => $f['taille_id'],
                    'periode'     => $f['periode'],
                ],
                [
                    'qte_prevue'  => max(0, (int)$f['qte_prevue']),
                    'qte_inf'     => isset($f['qte_inf']) ? max(0, (int)$f['qte_inf']) : null,
                    'qte_sup'     => isset($f['qte_sup']) ? max(0, (int)$f['qte_sup']) : null,
                    'modele'      => $f['modele'] ?? 'prophet',
                    'generated_at'=> now(),
                    'updated_at'  => now(),
                    'created_at'  => now(),
                ]
            );
            $count++;
        }

        $this->info("Prévisions upsertées : {$count}");
        return self::SUCCESS;
    }
}
