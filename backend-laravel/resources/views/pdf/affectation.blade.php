<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Fiche d'affectation</title>
  <style>
    body {
      font-family: DejaVu Sans, sans-serif;
      font-size: 12px;
    }
    table {
      border-collapse: collapse;
      width: 100%;
      margin-top: 20px;
    }
    th, td {
      border: 1px solid #000;
      padding: 5px;
      text-align: center;
    }
    .signature {
      margin-top: 40px;
      text-align: right;
    }
    .header {
      text-align: center;
      font-weight: bold;
      font-size: 16px;
      margin-bottom: 20px;
    }
  </style>
</head>
<body>

  <div class="header">Fiche d'Affectation de Matériels</div>

  <p><strong>Employé :</strong> {{ $employe->nom }}</p>
  <p><strong>Fonction :</strong> {{ $employe->fonction ?? 'N/A' }}</p>

  <table>
    <thead>
      <tr>
        <th>Date</th>
        <th>Commentaire</th>
        <th>Matériel</th>
        <th>Taille</th>
        <th>Quantité</th>
        @foreach (['Jan','Fév','Mar','Avr','Mai','Juin','Juil','Août','Sep','Oct','Nov','Déc'] as $mois)
          <th>{{ $mois }}</th>
        @endforeach
        <th>Signature</th>
      </tr>
    </thead>
    <tbody>
      @foreach ($affectations as $affectation)
        @foreach ($affectation->details as $detail)
          <tr>
            <td>{{ $affectation->date ?? '' }}</td>
            <td>{{ $affectation->commentaire ?? '' }}</td>
            <td>{{ $detail->materiel->nom ?? '' }}</td>
            <td>{{ $detail->taille->libelle ?? '' }}</td>
            <td>{{ $detail->quantite }}</td>
            @for ($i = 0; $i < 12; $i++)
              <td>☐</td>
            @endfor
            <td>................................</td>
          </tr>
        @endforeach
      @endforeach
    </tbody>
  </table>

  <div class="signature">
    <p><strong>Signature globale de l'employé :</strong></p>
    <p>....................................................</p>
  </div>

</body>
</html>
