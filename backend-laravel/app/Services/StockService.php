<?php
// app/Services/StockService.php
namespace App\Services;

use App\Models\Stock;
use App\Models\Materiel;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class StockService
{
    public function currentFor(int $materielId): int
    {
        return (int) Stock::forMateriel($materielId)
            ->selectRaw("SUM(CASE 
                WHEN type_mouvement = 'IN'  THEN quantite
                WHEN type_mouvement = 'OUT' THEN -quantite
                WHEN type_mouvement = 'ADJ' THEN quantite
                ELSE 0 END) as stock")
            ->value('stock');
    }

    public function move(array $data): Stock
    {
        // $data: materiel_id, type_mouvement, quantite, date_mouvement, motif?, reference_type?, reference_id?
        return DB::transaction(function () use ($data) {
            $qty = (int) $data['quantite'];
            if ($qty <= 0) {
                throw new InvalidArgumentException('Quantité invalide.');
            }

            if ($data['type_mouvement'] === Stock::OUT) {
                $available = $this->currentFor($data['materiel_id']);
                if ($available < $qty) {
                    throw new InvalidArgumentException("Stock insuffisant (dispo: {$available}).");
                }
            }

            return Stock::create($data);
        });
    }
}
