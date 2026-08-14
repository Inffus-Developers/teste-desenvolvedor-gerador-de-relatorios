<?php

namespace App\Services;

use App\Models\Charge;

class SimplePdfReport
{
    public function render(iterable $charges, array $totals, array $filters): string
    {
        $lines = ['RELATORIO DE FATURAMENTO', sprintf('Periodo: %s | Inicio: %s | Fim: %s', $filters['period'], $filters['start_date'] ?? '-', $filters['end_date'] ?? '-'), 'Cliente | Descricao | Status | Original | Juros | Atualizado | Pago'];
        foreach ($charges as $charge) $lines[] = $this->chargeLine($charge);
        $lines[] = 'TOTALIZADORES'; foreach ($totals as $label => $value) $lines[] = "{$label}: {$value}";
        return $this->pdf(array_chunk($lines, 46));
    }

    private function chargeLine(Charge $charge): string { return sprintf('%s | %s | %s | %.2f | %.2f | %.2f | %.2f', $charge->client_name, $charge->description, $charge->status, $charge->original_amount, $charge->interest_amount, $charge->final_amount, $charge->paid_amount ?? 0); }
    private function pdf(array $pages): string
    {
        $objects = [1 => '<< /Type /Catalog /Pages 2 0 R >>']; $refs = [];
        foreach ($pages as $index => $lines) { $page = 3 + $index * 2; $contentObject = $page + 1; $refs[] = "{$page} 0 R"; $content = "BT\n/F1 9 Tf\n50 800 Td\n12 TL\n"; foreach ($lines as $line) $content .= '(' . $this->escape($line) . ") Tj\nT*\n"; $content .= 'ET'; $objects[$page] = "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> >> >> /Contents {$contentObject} 0 R >>"; $objects[$contentObject] = '<< /Length ' . strlen($content) . " >>\nstream\n{$content}\nendstream"; }
        $objects[2] = '<< /Type /Pages /Kids [' . implode(' ', $refs) . '] /Count ' . count($pages) . ' >>'; ksort($objects); $pdf = "%PDF-1.4\n"; $offsets = [0];
        foreach ($objects as $number => $object) { $offsets[$number] = strlen($pdf); $pdf .= "{$number} 0 obj\n{$object}\nendobj\n"; }
        $xref = strlen($pdf); $pdf .= 'xref' . "\n0 " . (count($objects) + 1) . "\n0000000000 65535 f \n"; foreach (array_keys($objects) as $number) $pdf .= sprintf('%010d 00000 n ', $offsets[$number]) . "\n";
        return $pdf . "trailer\n<< /Size " . (count($objects) + 1) . " /Root 1 0 R >>\nstartxref\n{$xref}\n%%EOF";
    }
    private function escape(string $value): string { $value = iconv('UTF-8', 'Windows-1252//TRANSLIT//IGNORE', $value) ?: ''; $value = preg_replace('/[^\x20-\x7E\x80-\xFF]/', ' ', $value) ?: ''; return str_replace(['\\', '(', ')'], ['\\\\', '\\(', '\\)'], mb_strimwidth($value, 0, 125, '...')); }
}
