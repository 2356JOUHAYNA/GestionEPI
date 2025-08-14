<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Distribution EPI</title>
  <style>
    body{font-family: DejaVu Sans, sans-serif; font-size:12px; color:#222}
    .title{font-size:16px; font-weight:bold; margin-bottom:8px}
    table{border-collapse:collapse; width:100%}
    th,td{border:1px solid #999; padding:6px; text-align:left}
    .muted{color:#666}
    .grid{display:grid; grid-template-columns:repeat(12,1fr); gap:2px; margin-top:8px}
    .cell{border:1px solid #ccc; padding:4px; text-align:center; font-size:10px}
    .footer{margin-top:24px; display:flex; justify-content:space-between}
    .sign{width:45%; border-top:1px solid #000; text-align:center; padding-top:6px}
  </style>
</head>
<body>
  <div class="title">Fiche de distribution EPI (ligne)</div>
  <p><strong>Date :</strong> {{ $date }}</p>

  <table>
    <tr><th>Employé</th><td>{{ $employe->matricule }} — {{ $employe->nom }} {{ $employe->prenom }}</td></tr>
    <tr><th>Manager</th><td>{{ $detail->affectation->manager->nom ?? '—' }}</td></tr>
    <tr><th>Matériel</th><td>{{ $detail->materiel->nom }}</td></tr>
    <tr><th>Taille</th><td>{{ $detail->taille->libelle }}</td></tr>
  </table>

  <p class="muted">Suivi mensuel</p>
  <div class="grid">
    @foreach (['Jan','Fév','Mar','Avr','Mai','Juin','Juil','Août','Sep','Oct','Nov','Déc'] as $m)
      <div class="cell">{{ $m }}</div>
    @endforeach
  </div>

  <div class="footer">
    <div class="sign">Signature employé</div>
    <div class="sign">Visa Service généraux</div>
  </div>
</body>
</html>
