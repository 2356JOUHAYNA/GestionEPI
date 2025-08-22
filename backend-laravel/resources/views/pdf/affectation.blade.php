<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <title>{{ $doc_title }}</title>
  <style>
    body { font-family: DejaVu Sans, sans-serif; font-size: 12px; color: #111; }
    .header { text-align:center; margin-bottom: 20px; }
    .box { border:1px solid #888; padding:12px; border-radius:6px; margin-bottom: 12px; }
    .row { display:flex; justify-content:space-between; gap:12px; }
    .col { flex:1; }
    h1 { font-size: 18px; margin:0 0 6px; }
    h2 { font-size: 15px; margin:0 0 6px; }
    table { width:100%; border-collapse: collapse; }
    th, td { padding: 8px; border:1px solid #ccc; text-align:left; }
    .small { color:#666; }
  </style>
</head>
<body>
  <div class="header">
    <h1>{{ $doc_title }}</h1>
    <div class="small">Émis le : {{ $date }}</div>
  </div>

  <div class="box">
    <h2>Informations employé</h2>
    <div class="row">
      <div class="col"><strong>Nom :</strong> {{ $employe['nom'] }}</div>
      <div class="col"><strong>Matricule :</strong> {{ $employe['matricule'] }}</div>
      <div class="col"><strong>Fonction :</strong> {{ $employe['fonction'] }}</div>
    </div>
    <div class="row" style="margin-top:8px;">
      <div class="col"><strong>Manager :</strong> {{ $manager }}</div>
    </div>
  </div>

  <div class="box">
    <h2>Détail distribution</h2>
    <table>
      <thead>
      <tr>
        <th>Matériel</th>
        <th>Taille</th>
        <th>Quantité</th>
      </tr>
      </thead>
      <tbody>
      <tr>
        <td>{{ $materiel }}</td>
        <td>{{ $taille }}</td>
        <td>{{ $quantite }}</td>
      </tr>
      </tbody>
    </table>
  </div>

  @if(!empty($mois) && is_array($mois))
    <div class="box">
      <h2>Suivi mensuel</h2>
      <table>
        <thead>
        <tr>
          <th>Jan</th><th>Fév</th><th>Mar</th><th>Avr</th><th>Mai</th><th>Juin</th>
          <th>Juil</th><th>Août</th><th>Sep</th><th>Oct</th><th>Nov</th><th>Déc</th>
        </tr>
        </thead>
        <tbody>
        @php
    // Si $mois n'est pas défini ou n'est pas un tableau, on l'initialise vide
    $mois = is_array($mois ?? null) ? $mois : [];
@endphp

<tr>
    @for($i = 0; $i < 12; $i++)
        <td>
            {{ !empty($mois[$i]) ? '✔' : '' }}
        </td>
    @endfor
</tr>
        </tbody>
      </table>
    </div>
  @endif

  <div class="small" style="margin-top:16px;">
    Document généré automatiquement.
  </div>
</body>
</html>
