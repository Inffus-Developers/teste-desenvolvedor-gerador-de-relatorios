<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Charge extends Model
{
    use HasFactory;

    /**
     * Regra de negócio adotada: juros compostos.
     *
     * Valor atualizado = valor_original × (1 + taxa_mensal)^(dias_em_atraso / 30)
     *
     * A taxa mensal é armazenada em percentual, por exemplo 2.5 para 2,5% ao mês.
     * O cálculo é executado no backend para garantir consistência em listagens,
     * telas e relatórios.
     */
    protected $fillable = [
        'client_name',
        'description',
        'original_amount',
        'issue_date',
        'due_date',
        'payment_date',
        'status',
        'interest_rate',
        'paid_amount',
        'paid_interest',
    ];

    protected $casts = [
        'issue_date' => 'date',
        'due_date' => 'date',
        'payment_date' => 'date',
        'original_amount' => 'decimal:2',
        'interest_rate' => 'decimal:2',
        'paid_amount' => 'decimal:2',
        'paid_interest' => 'decimal:2',
    ];

    protected $appends = ['final_amount', 'interest_amount'];

    public static function calculateUpdatedAmount(float|int $originalAmount, float|int $monthlyRatePercent, int $daysLate): float
    {
        if ($daysLate <= 0 || $originalAmount <= 0) {
            return (float) $originalAmount;
        }

        $monthlyRate = (float) $monthlyRatePercent / 100;

        return round((float) $originalAmount * pow(1 + $monthlyRate, $daysLate / 30), 2);
    }

    public function getInterestAmountAttribute(): float
    {
        if (! $this->due_date || $this->status === 'cancelada') {
            return 0.0;
        }

        if ($this->status === 'paga' && $this->paid_interest !== null) {
            return (float) $this->paid_interest;
        }

        $dueDate = Carbon::parse($this->due_date);
        $now = Carbon::now();

        if ($now->lessThanOrEqualTo($dueDate)) {
            return 0.0;
        }

        $daysLate = max(0, $dueDate->diffInDays($now));
        $updatedAmount = self::calculateUpdatedAmount($this->original_amount, $this->interest_rate, $daysLate);

        return round($updatedAmount - (float) $this->original_amount, 2);
    }

    public function getFinalAmountAttribute(): float
    {
        if ($this->status === 'cancelada' || ! $this->due_date) {
            return (float) $this->original_amount;
        }

        if ($this->status === 'paga') {
            return $this->paid_amount !== null ? (float) $this->paid_amount : (float) $this->original_amount;
        }

        $dueDate = Carbon::parse($this->due_date);
        $now = Carbon::now();

        if ($now->lessThanOrEqualTo($dueDate)) {
            return (float) $this->original_amount;
        }

        $daysLate = max(0, $dueDate->diffInDays($now));

        return self::calculateUpdatedAmount($this->original_amount, $this->interest_rate, $daysLate);
    }
}
