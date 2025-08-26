<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<title>Distribution EPI — {{ $date }}</title>
<style>
  body{font-family: DejaVu Sans, sans-serif;font-size:12px;color:#333;margin:24px}
  h1{font-size:18px;margin:0 0 6px}
  .meta p{margin:2px 0}
  table{width:100%;border-collapse:collapse;margin-top:12px}
  th,td{border:1px solid #aaa;padding:6px;text-align:left}
  th{background:#f0f0f0}
  tfoot td{font-weight:bold}
</style>
</head>
<body>
  <h1>Fiche de Distribution — {{ $date }}</h1>

  <div class="meta">
    <p><strong>Employé :</strong> {{ $employe->nom }} {{ $employe->prenom }} ({{ $employe->matricule }})</p>
    <p><strong>Manager :</strong> {{ optional($manager)->nom ?? '—' }}</p>
  </div>

  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>Matériel</th>
        <th>Taille</th>
        <th>Quantité</th>
        <th>N° Affectation</th>
      </tr>
    </thead>
    <tbody>
      @php $i = 1; $total = 0; @endphp

      @forelse ($details as $d)
        @php
          $materiel = optional($d->materiel)->nom ?? optional($d->materiel)->libelle ?? '—';
          $taille   = optional($d->taille)->libelle ?? optional($d->taille)->nom ?? '—';
          $q        = (int)($d->quantite ?? 1);
          $total   += $q;
        @endphp
        <tr>
          <td>{{ $i++ }}</td>
          <td>{{ $materiel }}</td>
          <td>{{ $taille }}</td>
          <td>{{ $q }}</td>
          <td>#{{ $d->affectation_id ?? '—' }}</td>
        </tr>
      @empty
        <tr>
          <td colspan="5" style="text-align:center">Aucune distribution pour cette date.</td>
        </tr>
      @endforelse
    </tbody>
    <tfoot>
      <tr>
        <td colspan="3">Total</td>
        <td colspan="2">{{ $total }}</td>
      </tr>
    </tfoot>
  </table>
</body>
</html>
