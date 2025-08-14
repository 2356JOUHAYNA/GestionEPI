<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Fiche de Distribution</title>
    <style>
        body {
            font-family: DejaVu Sans, sans-serif;
            font-size: 12px;
            color: #333;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .header h1 {
            background: #007B5E;
            color: white;
            padding: 10px;
        }
        .info {
            margin-bottom: 20px;
        }
        .info p {
            margin: 2px 0;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
        }
        th, td {
            border: 1px solid #aaa;
            padding: 6px;
            text-align: left;
        }
        th {
            background-color: #f0f0f0;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Fiche de Distribution des Équipements</h1>
    </div>

    <div class="info">
        <p><strong>Manager :</strong> {{ $manager->nom }}</p>
        <p><strong>Date de distribution :</strong> {{ now()->format('d/m/Y') }}</p>
    </div>

    <table>
        <thead>
            <tr>
                <th>Employé</th>
                <th>Matériel</th>
                <th>Taille</th>
                <th>Quantité</th>
            </tr>
        </thead>
        <tbody>
            @foreach ($employes as $employe)
                @foreach ($employe->affectations as $affectation)
                    @foreach ($affectation->details as $detail)
                        <tr>
                            <td>{{ $employe->nom }} {{ $employe->prenom }}</td>
                            <td>{{ $detail->materiel->nom }}</td>
                            <td>{{ $detail->taille->libelle }}</td>
                            <td>{{ $detail->quantite }}</td>
                        </tr>
                    @endforeach
                @endforeach
            @endforeach
        </tbody>
    </table>
</body>
</html>
