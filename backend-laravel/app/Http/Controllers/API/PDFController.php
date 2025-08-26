<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Carbon;

use App\Models\Affectation;
use App\Models\DetailAffectation;
use App\Models\Employe;
use App\Models\Distribution;

class PDFController extends Controller
{
    /**
     * GET /api/epi/distributions/pdf-line/{affectationId}/{detailId}/{employeId}
     * Génère le PDF d'une ligne distribuée.
     */
    public function distributionLinePDF(int $affectationId, int $detailId, int $employeId)
    {
        $employe = Employe::findOrFail($employeId);

        $detail = DetailAffectation::with(['materiel', 'taille', 'affectation.manager'])
            ->findOrFail($detailId);

        // Cohérence : la ligne doit appartenir à l'affectation passée
        if ((int) $detail->affectation_id !== (int) $affectationId) {
            abort(422, 'Le détail ne correspond pas à cette affectation.');
        }

        $pdf = Pdf::loadView('pdf.distribution_line', [
            'employe' => $employe,
            'detail'  => $detail,
            'date'    => now()->format('Y-m-d'),
        ])->setPaper('A4');

        return $pdf->download("distribution_{$employe->matricule}_{$detail->id}.pdf");
    }

    /**
     * GET /api/epi/distributions/pdf/{affectation}/{detail}?nom=...
     * Génère le PDF d’une affectation + un de ses détails (Option A : cast).
     */
    public function generateAffectationPDF(Request $request, $affectation, $detail)
    {
        // cast des paramètres d’URL
        $affectation = (int) $affectation;
        $detail      = (int) $detail;

        $nomEmploye = trim($request->query('nom', ''));

        $aff = Affectation::with([
            'manager',
            'employe',
            'details.materiel',
            'details.taille',
        ])->find($affectation);

        if (!$aff) {
            return response()->json(['message' => 'Affectation introuvable'], 404);
        }

        $det = optional($aff->details)->firstWhere('id', $detail);
        if (!$det) {
            return response()->json(['message' => 'Détail introuvable pour cette affectation'], 404);
        }

        $data = [
            'doc_title' => 'Fiche de distribution - EPI',
            'date'      => now()->format('d/m/Y H:i'),
            'manager'   => $aff->manager->nom ?? '—',
            'employe'   => [
                'nom'       => $nomEmploye !== '' ? $nomEmploye : trim(($aff->employe->nom ?? '—').' '.($aff->employe->prenom ?? '')),
                'matricule' => $aff->employe->matricule ?? '—',
                'fonction'  => $aff->employe->fonction ?? '—',
            ],
            'materiel'  => $det->materiel->nom ?? $det->materiel->libelle ?? '—',
            'taille'    => $det->taille->libelle ?? $det->taille->nom ?? '—',
            'quantite'  => (int) ($det->quantite ?? 1),
            'mois'      => $det->trace_mois ?? [],
        ];

        $pdf = Pdf::loadView('pdf.affectation', $data)->setPaper('A4');

        return $pdf->stream(sprintf('affectation_%s_detail_%s.pdf', $affectation, $detail));
    }

    /**
     * GET /api/epi/distributions/pdf-employe-jour/{employeId}?date=YYYY-MM-DD
     * Regroupe toutes les distributions d’un employé à la date donnée
     * + Traçabilité + Fréquence (nombre_mois).
     */
    public function distributionsDuJourPourEmploye(Request $request, int $employeId)
{
    $date = $request->query('date');
    $jour = $date ? \Illuminate\Support\Carbon::parse($date)->toDateString() : now()->toDateString();

    $employe = \App\Models\Employe::findOrFail($employeId);

    // On charge TOUTES les fréquences et on décidera en PHP laquelle afficher
    $rows = \App\Models\Distribution::with([
            'affectation.manager',
            'detail.taille',
            'detail.materiel.frequences', // <- sans filtre, on choisit après
        ])
        ->where('employe_id', $employeId)
        ->whereDate('created_at', $jour)
        ->orderBy('affectation_id')
        ->orderBy('detail_id')
        ->get();

    // Construire les données attendues par la vue
    $details = $rows->map(function ($r) use ($jour) {
        $materiel = optional($r->detail)->materiel;
        $taille   = optional($r->detail)->taille;

        // 1) fréquence active à la date du PDF
        $freqRow = null;
        if ($materiel && $materiel->frequences) {
            $freqRow = $materiel->frequences->first(function ($f) use ($jour) {
                $deb = $f->date_debut instanceof \Carbon\Carbon ? $f->date_debut->toDateString() : (string)$f->date_debut;
                $fin = $f->date_fin   instanceof \Carbon\Carbon ? $f->date_fin->toDateString()   : (string)$f->date_fin;
                return $deb <= $jour && (empty($fin) || $fin >= $jour);
            });

            // 2) sinon, on prend la plus récente (fallback)
            if (!$freqRow) {
                $freqRow = $materiel->frequences->sortByDesc('date_debut')->first();
            }
        }

        $n = $freqRow->nombre_mois ?? null;                 // ← le nombre à afficher
        $label = $n ? ($n == 1 ? '1 mois' : "{$n} mois") : '—';

        return (object) [
            'quantite'        => (int)($r->quantite ?? 1),
            'materiel'        => $materiel,
            'taille'          => $taille,
            'trace_mois'      => $r->trace_mois ?? [],
            'frequence_mois'  => $n,       // ← **CE CHAMP EST LU PAR LA VUE**
            'frequence_label' => $label,   // (si tu veux aussi le libellé)
        ];
    });

    $manager = optional(optional($rows->first())->affectation)->manager;

    $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('pdf.distribution_jour', [
        'date'    => \Illuminate\Support\Carbon::parse($jour)->format('d/m/Y'),
        'employe' => $employe,
        'manager' => $manager,
        'details' => $details,
    ])->setPaper('A4');

    return $pdf->stream("distribution_{$employe->matricule}_{$jour}.pdf");
}

}
