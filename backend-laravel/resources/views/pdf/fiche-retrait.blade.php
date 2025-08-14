<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Fiche de retrait</title>
    <style>
        body { font-family: DejaVu Sans; font-size: 12px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        td, th { border: 1px solid #000; padding: 5px; }
    </style>
</head>
<body>
    <h2>Fiche de retrait des équipements</h2>
    <p><strong>Employé :</strong> {{ $employe->nom }} {{ $employe->prenom }}</p>

    <table>
        <thead>
            <tr>
                <th>Matériel</th>
                <th>Taille</th>
                <th>Quantité</th>
                <th>Manager</th>
                <th>Date de retrait</th>
            </tr>
        </thead>
        <tbody>
            @foreach ($affectations as $aff)
                <tr>
                    <td>{{ $aff->materiel->nom }}</td>
                    <td>{{ $aff->taille->libelle }}</td>
                    <td>{{ $aff->quantite }}</td>
                    <td>{{ $aff->manager->nom ?? '---' }}</td>
                    <td>{{ $aff->updated_at->format('d/m/Y H:i') }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>
</body>
</html>
