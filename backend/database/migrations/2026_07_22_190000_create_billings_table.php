<?php

use App\Enums\BillingStatus;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('billings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('customer_id')->constrained()->restrictOnDelete();
            $table->string('description');
            $table->decimal('original_amount', 15, 2);
            $table->date('issue_date');
            $table->date('due_date');
            $table->date('payment_date')->nullable();
            $table->decimal('monthly_interest_rate', 8, 4)->default(0);
            $table->string('status', 16)->default(BillingStatus::Pending->value);
            $table->decimal('paid_amount', 15, 2)->nullable();
            $table->decimal('interest_paid', 15, 2)->nullable();
            $table->timestamps();

            $table->index(['status', 'due_date']);
            $table->index(['customer_id', 'issue_date']);
            $table->index('payment_date');
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('billings');
    }
};
