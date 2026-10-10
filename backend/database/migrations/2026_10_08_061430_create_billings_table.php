<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('billings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('customer_id')->constrained('customers')->onDelete('cascade');
            $table->string('description', 200);
            $table->decimal('original_amount', 12, 2);
            // Usamos 'date' em vez de 'datetime' ou 'timestamp' porque a regra 
            // de juros depende de dias em atraso (precisão de dia é suficiente)
            $table->date('issue_date');
            $table->date('due_date');
            $table->date('payment_date')->nullable();
            
            $table->decimal('interest_rate', 5, 2);
            $table->enum('status', ['pending', 'paid', 'overdue', 'canceled'])->default('pending');
            $table->timestamps();

            // ====================================================================
            // ÍNDICES DE PERFORMANCE
            // ====================================================================
            
            // 1. Otimiza relatórios filtrados por Cliente + Status (ex: "Cobranças pagas do João")
            $table->index(['customer_id', 'status']);
            
            // 2. Otimiza relatórios de faturamento filtrados por Status + Data de Emissão
            $table->index(['status', 'issue_date']);
            
            // 3. Otimiza o script de cálculo de juros (busca vencidos + data de vencimento)
            $table->index(['status', 'due_date']);
            
            // 4. Otimiza relatórios de caixa (recebimentos reais por data de pagamento)
            $table->index(['status', 'payment_date']);  
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('billings');
    }
};
