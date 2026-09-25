<?php

namespace App\Services;

use App\Models\ReportExport;
use Dompdf\Dompdf;
use Dompdf\Options;
use Generator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use RuntimeException;
use ZipArchive;

final class ReportWriter
{
    public function __construct(private BillingReport $report) {}

    public function write(ReportExport $export): string
    {
        Storage::disk('local')->makeDirectory('exports/'.$export->id);

        return $export->format === 'csv' ? $this->csv($export) : $this->pdf($export);
    }

    private function batches(ReportExport $export, int $size): Generator
    {
        $cursor = null;
        do {
            $query = DB::table('report_export_rows')->where('export_id', $export->id);
            $page = $this->report->order($query, $export->filters, '', 'charge_id')->cursorPaginate($size, ['*'], 'cursor', $cursor);
            yield $page->items();
            $cursor = $page->nextCursor();
        } while ($cursor !== null);
    }

    public static function safeCsv(string $value): string
    {
        return preg_match('/^[\s]*[=+@\-\t\r\n]/u', $value) ? "'".$value : $value;
    }

    private function csv(ReportExport $export): string
    {
        $path = 'exports/'.$export->id.'/relatorio.csv';
        $stream = fopen(Storage::disk('local')->path($path), 'wb');
        if ($stream === false) {
            throw new RuntimeException('Cannot create export');
        }
        try {
            fwrite($stream, "\xEF\xBB\xBF");
            $line = static function (array $cells) use ($stream): void {
                if (fputcsv($stream, array_map(fn ($v) => self::safeCsv((string) $v), $cells), ';', '"', '') === false) {
                    throw new RuntimeException('Cannot write CSV');
                }
            };
            $line(['Clara - Relatório de faturamento', 'Data de cálculo', $export->as_of]);
            $line(['Período', $export->filters['start_date'] ?? 'Sem início', $export->filters['end_date'] ?? 'Sem fim']);
            $line(['Filtros', json_encode($export->filters, JSON_UNESCAPED_UNICODE)]);
            $line(['Quantidade', 'Original', 'Juros', 'Atualizado', 'Recebido', 'Pendente']);
            $line(array_map(fn ($key) => $export->totals[$key], ['count', 'original_amount', 'interest', 'updated_amount', 'received_amount', 'pending_amount']));
            $line([]);
            $line(['ID', 'Cliente', 'Descrição', 'Emissão', 'Vencimento', 'Pagamento', 'Status', 'Original', 'Juros', 'Atualizado', 'Pago']);
            foreach ($this->batches($export, config('billing.export_chunk_size')) as $rows) {
                foreach ($rows as $row) {
                    $line([$row->charge_id, $row->customer_name, $row->description, $row->issued_at, $row->due_at, $row->paid_at,
                        $row->status, $row->original_amount, $row->interest, $row->updated_amount, $row->paid_amount]);
                }
                $export->increment('processed_rows', count($rows));
            }
        } finally {
            fclose($stream);
        }

        return $path;
    }

    private function pdf(ReportExport $export): string
    {
        $size = config('billing.pdf_rows_per_part');
        $multipart = $export->totals['count'] > $size;
        $dir = 'exports/'.$export->id;
        $path = $dir.'/relatorio.'.($multipart ? 'zip' : 'pdf');
        $zip = null;
        if ($multipart) {
            $zip = new ZipArchive;
            if ($zip->open(Storage::disk('local')->path($path), ZipArchive::CREATE | ZipArchive::OVERWRITE) !== true) {
                throw new RuntimeException('Cannot create ZIP');
            }
        }
        try {
            $part = 0;
            foreach ($this->batches($export, $size) as $rows) {
                $part++;
                $options = new Options(['isRemoteEnabled' => false, 'isPhpEnabled' => false, 'defaultFont' => 'DejaVu Sans']);
                $pdf = new Dompdf($options);
                $pdf->loadHtml(view('reports.billing', ['export' => $export, 'rows' => $rows, 'part' => $part])->render());
                $pdf->setPaper('A4', 'landscape');
                $pdf->render();
                $pdf->getCanvas()->page_text(727, 578, 'Página {PAGE_NUM} / {PAGE_COUNT}', $pdf->getFontMetrics()->getFont('DejaVu Sans'), 8, [0.35, 0.42, 0.37]);
                $partPath = $multipart ? $dir.'/parte-'.str_pad((string) $part, 5, '0', STR_PAD_LEFT).'.pdf' : $path;
                if (! Storage::disk('local')->put($partPath, $pdf->output())) {
                    throw new RuntimeException('Cannot write PDF');
                }
                unset($pdf);
                gc_collect_cycles();
                if ($zip && ! $zip->addFile(Storage::disk('local')->path($partPath), basename($partPath))) {
                    throw new RuntimeException('Cannot add PDF');
                }
                $export->increment('processed_rows', count($rows));
            }
        } finally {
            if ($zip && ! $zip->close()) {
                throw new RuntimeException('Cannot finalize ZIP');
            }
        }
        if ($multipart) {
            foreach (Storage::disk('local')->files($dir) as $file) {
                if (str_ends_with($file, '.pdf')) {
                    Storage::disk('local')->delete($file);
                }
            }
        }

        return $path;
    }
}
