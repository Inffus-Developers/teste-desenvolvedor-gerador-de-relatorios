<?php

return [
    'customers' => (int) env('PERFORMANCE_CUSTOMERS', 1000),
    'billings' => (int) env('PERFORMANCE_BILLINGS', 100000),
    'chunk_size' => (int) env('PERFORMANCE_CHUNK_SIZE', 1000),
];
