<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // Supprime si déjà existante (pour éviter l’erreur à la création)
        DB::statement('DROP VIEW IF EXISTS demande_mensuelle_materiel_taille');

        DB::statement(<<<'SQL'
CREATE VIEW demande_mensuelle_materiel_taille AS
SELECT
  da.materiel_id,
  da.taille_id,
  DATE(CONCAT(YEAR(a.`date`), '-', LPAD(MONTH(a.`date`), 2, '0'), '-01')) AS periode,
  SUM(da.quantite) AS qte_sortie
FROM detail_affectations AS da
JOIN affectations AS a ON a.id = da.affectation_id
GROUP BY
  da.materiel_id,
  da.taille_id,
  DATE(CONCAT(YEAR(a.`date`), '-', LPAD(MONTH(a.`date`), 2, '0'), '-01'));
SQL);
    }

    public function down(): void
    {
        DB::statement('DROP VIEW IF EXISTS demande_mensuelle_materiel_taille');
    }
};
