<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<title>Distribution EPI — {{ $date ?? now()->format('d/m/Y') }}</title>
<style>
  *{ box-sizing:border-box }
  body{ font-family: DejaVu Sans, sans-serif; font-size:12px; color:#333; margin:22px }
  h1{ font-size:18px; margin:0 0 8px }
  .meta p{ margin:2px 0 }
  .hr{ height:1px; background:#ddd; margin:10px 0 14px 0 }

  table{ width:100%; border-collapse:collapse; margin-top:10px }
  th,td{ border:1px solid #aaa; padding:6px; text-align:left; vertical-align:top }
  th{ background:#f4f6f8; font-weight:bold }
  tfoot td{ font-weight:bold }

  /* PDF-friendly */
  thead { display: table-header-group; }
  tfoot { display: table-row-group; }
  tr    { page-break-inside: avoid; }

  .right{ text-align:right }
  .center{ text-align:center }

  .signatures{ width:100%; margin-top:36px; border-collapse:separate; border-spacing:18px 0 }
  .signature-box{ height:90px; padding:8px 12px; border:1px solid #bbb; border-radius:4px; }
  .legend{ font-size:11px; color:#666; margin-bottom:6px }
  .line{ margin-top:48px; border-top:1px solid #000; height:1px }
  .place-date{ margin-top:14px; font-size:11px }
</style>
</head>
<body>
  @php
    $nomAffiche = trim((string)request('nom', ''));
    if ($nomAffiche === '') {
        $nomAffiche = trim(($employe->nom ?? '—').' '.($employe->prenom ?? ''));
    }
    $moisNoms = ['Jan','Fév','Mar','Avr','Mai','Juin','Juil','Août','Sep','Oct','Nov','Déc'];
  @endphp

  <h1>Fiche de Distribution — {{ $date ?? now()->format('d/m/Y') }}</h1>
  <div class="meta">
    <p><strong>Employé :</strong> {{ $nomAffiche }} @if(!empty($employe->matricule)) ({{ $employe->matricule }}) @endif</p>
    @if(!empty($employe->fonction))
      <p><strong>Fonction :</strong> {{ $employe->fonction }}</p>
    @endif
    <p><strong>Manager :</strong> {{ optional($manager)->nom ?? '—' }}</p>
  </div>
  <div class="hr"></div>

  <table>
    <thead>
      <tr>
        <th style="width:40px" class="center">#</th>
        <th>Matériel</th>
        <th style="width:110px">Taille</th>
        <th style="width:120px" class="center">Fréquence (mois)</th> {{-- nombre_mois --}}
        <th style="width:80px"  class="right">Quantité</th>
        <th style="width:220px">Traçabilité</th>
      </tr>
    </thead>
    <tbody>
      @php $i=1; $total=0; @endphp
      @forelse ($details as $d)
        @php
          $materiel = optional($d->materiel)->nom ?? optional($d->materiel)->libelle ?? '—';
          $taille   = optional($d->taille)->libelle ?? optional($d->taille)->nom ?? '—';
          $q        = (int)($d->quantite ?? 1);  $total += $q;

          // Traçabilité : convertir JSON -> array si nécessaire
          $flags = $d->trace_mois ?? [];
          if (is_string($flags)) { $tmp=json_decode($flags,true); if (is_array($tmp)) $flags=$tmp; }
          $trace = '—';
          if (is_array($flags) && count($flags) === 12) {
              $sel = [];
              foreach ($flags as $idx=>$val) if ($val) $sel[] = $moisNoms[$idx] ?? $idx+1;
              $trace = count($sel) ? implode(', ', $sel) : '—';
          }
        @endphp
        <tr>
          <td class="center">{{ $i++ }}</td>
          <td>{{ $materiel }}</td>
          <td>{{ $taille }}</td>
          <td class="center">{{ $d->frequence_mois ?? '—' }}</td>  {{-- on affiche le nombre_mois --}}
          <td class="right">{{ $q }}</td>
          <td>{{ $trace }}</td>
        </tr>
      @empty
        <tr><td colspan="6" class="center">Aucune distribution pour cette date.</td></tr>
      @endforelse
    </tbody>
    <tfoot>
      <tr>
        {{-- 6 colonnes au total => 4 + 1 (total) + 1 (vide) --}}
        <td colspan="4" class="right">Total</td>
        <td class="right">{{ $total }}</td>
        <td></td>
      </tr>
    </tfoot>
  </table>

  <div class="place-date">Fait à : _____________________  le : {{ $date ?? now()->format('d/m/Y') }}</div>
  <table class="signatures">
    <tr>
      <td>
        <div class="signature-box">
          <div class="legend"><strong>Signature de l’employé</strong></div>
          <div class="line"></div>
        </div>
      </td>
      <td>
        <div class="signature-box">
          <div class="legend"><strong>Visa du manager</strong></div>
          <div class="line"></div>
        </div>
      </td>
      <td>
        <div class="signature-box">
          <div class="legend"><strong>Cachet & signature (Services Généraux)</strong></div>
          <div class="line"></div>
        </div>
      </td>
    </tr>
  </table>
</body>
</html>
