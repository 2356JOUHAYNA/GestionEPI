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

  table{ width:100%; border-collapse:collapse; margin-top:10px; table-layout: fixed; }
  th,td{ border:1px solid #aaa; padding:6px; text-align:left; vertical-align:middle; word-wrap: break-word; }
  th{ background:#f4f6f8; font-weight:bold }
  tfoot td{ font-weight:bold }

  /* PDF-friendly */
  thead { display: table-header-group; }
  tfoot { display: table-row-group; }
  tr    { page-break-inside: avoid; }

  .right{ text-align:right }
  .center{ text-align:center }

  /* Colonne signature */
  .sigcell { padding: 0 6px; }
  .sigbox  { height: 26px; margin: 6px auto; border: 1px dashed #888; border-radius: 3px; }
  .sigline { width: 85%; height:0; border-top:1px solid #000; margin: 14px auto 6px; }

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
    <colgroup>
      <col style="width:40px">      <!-- # -->
      <col>                         <!-- Matériel -->
      <col style="width:110px">     <!-- Taille -->
      <col style="width:120px">     <!-- Fréquence -->
      <col style="width:80px">      <!-- Quantité -->
      <col style="width:220px">     <!-- Traçabilité -->
      <col style="width:140px">     <!-- Signature -->
    </colgroup>
    <thead>
      <tr>
        <th class="center">#</th>
        <th>Matériel</th>
        <th>Taille</th>
        <th class="center">Fréquence (mois)</th>
        <th class="right">Quantité</th>
        <th>Traçabilité</th>
        <th class="center">Signature</th>
      </tr>
    </thead>
    <tbody>
      @php $i=1; $total=0; @endphp
      @forelse ($details as $d)
        @php
          $materiel = optional($d->materiel)->nom ?? optional($d->materiel)->libelle ?? '—';
          $taille   = optional($d->taille)->libelle ?? optional($d->taille)->nom ?? '—';
          $q        = (int)($d->quantite ?? 1);  $total += $q;

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
          <td class="center">{{ $d->frequence_mois ?? '—' }}</td>
          <td class="right">{{ $q }}</td>
          <td>{{ $trace }}</td>
          <td class="sigcell">
            <div class="sigbox"></div>
            <div class="sigline"></div>
          </td>
        </tr>
      @empty
        <tr><td colspan="7" class="center">Aucune distribution pour cette date.</td></tr>
      @endforelse
    </tbody>
    <tfoot>
      <tr>
        <td colspan="5" class="right">Total</td>
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
