<?php

namespace App\Jobs;

use App\Models\ReportExport;
use App\Services\BillingReport;
use App\Services\ReportWriter;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Throwable;

class GenerateReport implements ShouldQueue
{
    use Queueable;

    public int $tries = 1;

    public int $timeout = 3600;

    public bool $failOnTimeout = true;

    public function __construct(public string $exportId) {}

    public function handle(BillingReport $report, ReportWriter $writer): void
    {
        $export = ReportExport::findOrFail($this->exportId);
        if ($export->status === 'completed' || $export->expires_at->isPast()) {
            return;
        }
        $export->update(['status' => 'processing', 'processed_rows' => 0, 'error' => null]);
        // Snapshot no banco: nenhum conjunto completo passa pela memória do PHP.
        DB::transaction(function () use ($export, $report) {
            DB::table('report_export_rows')->where('export_id', $export->id)->delete();
            $source = DB::query()->fromSub($report->query($export->filters, $export->as_of), 'source')
                ->selectRaw('? as export_id', [$export->id])->addSelect([
                    'id', 'customer_name', 'description', 'issued_at', 'due_at', 'paid_at', 'status',
                    'original_amount', 'interest', 'updated_amount', 'paid_amount',
                ]);
            DB::table('report_export_rows')->insertUsing([
                'export_id', 'charge_id', 'customer_name', 'description', 'issued_at', 'due_at', 'paid_at', 'status',
                'original_amount', 'interest', 'updated_amount', 'paid_amount',
            ], $source);
            $rows = DB::table('report_export_rows')->where('export_id', $export->id);
            $export->update(['totals' => $report->totals($rows)]);
        });
        $path = $writer->write($export->fresh());
        $export->update(['status' => 'completed', 'path' => $path]);
        DB::table('report_export_rows')->where('export_id', $export->id)->delete();
    }

    public function failed(?Throwable $exception): void
    {
        ReportExport::whereKey($this->exportId)->update(['status' => 'failed', 'error' => 'Não foi possível gerar o arquivo. Tente novamente com um período menor.']);
        DB::table('report_export_rows')->where('export_id', $this->exportId)->delete();
        Storage::disk('local')->deleteDirectory('exports/'.$this->exportId);
    }
}
