<?php

namespace App\Actions;

use App\DTOs\BillingCalculationResult;
use App\Models\Billing;
use Carbon\Carbon;

class CalculateBillingInterestAction
{
    /**
     * Calcula juros compostos diários com base na data de vencimento e pagamento/hoje.
     */
    public function execute(Billing $billing, ?Carbon $referenceDate = null): BillingCalculationResult
    {
        $dueDate = Carbon::parse($billing->due_date)->startOfDay();

        // Determina a data limite para apuração dos juros
        if ($referenceDate !== null) {
            $endDate = $referenceDate->copy()->startOfDay();
        } elseif ($billing->payment_date) {
            $endDate = Carbon::parse($billing->payment_date)->startOfDay();
        } else {
            $endDate = Carbon::now()->startOfDay();
        }

        // Se a data de corte for menor ou igual ao vencimento, não há juros
        if ($endDate->lessThanOrEqualTo($dueDate)) {
            return new BillingCalculationResult(
                originalAmount: (float) $billing->original_amount,
                interestAmount: 0.00,
                finalAmount: (float) $billing->original_amount,
                daysOverdue: 0,
                dailyInterestRatePercent: 0.00,
                isOverdue: false
            );
        }

        $daysOverdue = (int) $dueDate->diffInDays($endDate);
        $monthlyRateDecimal = (float) $billing->interest_rate / 100;

        // Fórmula de taxa equivalente diária de juros compostos (base comercial de 30 dias):
        // i_d = ((1 + i_m) ^ (1 / 30)) - 1
        $dailyRateDecimal = pow(1 + $monthlyRateDecimal, 1 / 30) - 1;

        // Montante acumulado: M = P * ((1 + i_d) ^ n)
        $originalAmount = (float) $billing->original_amount;
        $finalAmount = $originalAmount * pow(1 + $dailyRateDecimal, $daysOverdue);

        $interestAmount = $finalAmount - $originalAmount;

        return new BillingCalculationResult(
            originalAmount: round($originalAmount, 2),
            interestAmount: round($interestAmount, 2),
            finalAmount: round($finalAmount, 2),
            daysOverdue: $daysOverdue,
            dailyInterestRatePercent: round($dailyRateDecimal * 100, 4),
            isOverdue: true
        );
    }
}