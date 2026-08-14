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
        Schema::create('charges', function (Blueprint $table) {
            $table->id();
            $table->string('client_name');
            $table->text('description');
            $table->decimal('original_amount', 10, 2);
            $table->date('issue_date');
            $table->date('due_date');
            $table->date('payment_date')->nullable();
            $table->enum('status', ['pendente', 'paga', 'atrasada', 'cancelada'])->default('pendente');
            $table->decimal('interest_rate', 5, 2)->default(0.00); // Ex: 1.00 para 1% ao mês/dia
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('charges');
    }
};
