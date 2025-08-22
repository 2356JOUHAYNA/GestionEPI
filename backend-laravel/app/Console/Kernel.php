<?php

namespace App\Console;

use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Console\Kernel as ConsoleKernel;

class Kernel extends ConsoleKernel
{
    /**
     * Les commandes artisan disponibles.
     *
     * @var array
     */
    protected $commands = [
        \App\Console\Commands\GenerateForecasts::class,
    ];

    /**
     * Définir la planification des tâches.
     *
     * @param \Illuminate\Console\Scheduling\Schedule $schedule
     * @return void
     */
    protected function schedule(Schedule $schedule)
    {
        // Planifie l'exécution quotidienne de la commande forecast:generate à 03:00
        $schedule->command('forecast:generate')->dailyAt('03:00');
    }

    /**
     * Charger les commandes artisan.
     *
     * @return void
     */
    protected function commands()
    {
        $this->load(__DIR__.'/Commands');

        require base_path('routes/console.php');
    }
}
