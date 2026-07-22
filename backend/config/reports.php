<?php

return [
    'pdf_max_rows' => (int) env('REPORT_PDF_MAX_ROWS', 2000),
    'csv_chunk_size' => (int) env('REPORT_CSV_CHUNK_SIZE', 1000),
];
