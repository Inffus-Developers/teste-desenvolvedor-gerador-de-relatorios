<?php

use App\Console\Commands\GenerateReportDatasetCommand;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('report:generate {count=50000}', function ($count) {
    $command = app(GenerateReportDatasetCommand::class);
    $command->setLaravel(app());
    $command->setInput($this->input);
    $command->setOutput($this->output);

    return $command->handle();
})->purpose('Generate a large dataset for report and performance testing');
