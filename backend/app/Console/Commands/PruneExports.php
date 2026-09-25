<?php

namespace App\Console\Commands;

use App\Models\ReportExport;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;

class PruneExports extends Command
{
    protected $signature = 'reports:prune';

    protected $description = 'Remove arquivos e snapshots de exportações expiradas';

    public function handle(): int
    {
        ReportExport::where('expires_at', '<', now())->lazyById(100)->each(function (ReportExport $export) {
            Storage::disk('local')->deleteDirectory('exports/'.$export->id);
            $export->delete();
        });

        return self::SUCCESS;
    }
}
