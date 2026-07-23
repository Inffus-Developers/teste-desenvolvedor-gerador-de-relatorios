<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('billings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('customer_id')->constrained()->cascadeOnDelete();
            $table->string('description');
            $table->decimal('original_amount', 15, 2);
            $table->date('issue_date');
            $table->date('due_date');
            $table->date('payment_date')->nullable();
            $table->decimal('monthly_interest_rate', 8, 6)->default(0);
            $table->string('status')->default('pending');
            $table->decimal('paid_amount', 15, 2)->nullable();
            $table->decimal('interest_amount_at_payment', 15, 2)->nullable();
            $table->timestamps();

            $table->index('customer_id');
            $table->index('status');
            $table->index('issue_date');
            $table->index('due_date');
            $table->index('payment_date');
            $table->index(['status', 'issue_date']);
            $table->index(['status', 'due_date']);
            $table->index(['status', 'payment_date']);
            $table->index(['customer_id', 'status']);
            $table->index(['customer_id', 'issue_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('billings');
    }
};
