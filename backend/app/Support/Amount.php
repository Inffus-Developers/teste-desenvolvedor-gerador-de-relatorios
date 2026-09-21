<?php

namespace App\Support;

use Brick\Math\BigDecimal;
use Brick\Math\RoundingMode;

final class Amount
{
    public static function format(string|int|float $value): string
    {
        [$integer, $fraction] = explode('.', (string) BigDecimal::of((string) $value)->toScale(2, RoundingMode::HalfUp));

        return preg_replace('/\B(?=(\d{3})+(?!\d))/', '.', $integer).','.$fraction;
    }
}
