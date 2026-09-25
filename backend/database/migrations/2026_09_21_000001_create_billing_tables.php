<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('customers', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('document', 20)->unique();
            $table->string('email');
            $table->boolean('active')->default(true);
            $table->timestamps();
            $table->index(['name', 'id']);
            $table->index(['active', 'id']);
        });
        Schema::create('charges', function (Blueprint $table) {
            $table->id();
            $table->foreignId('customer_id')->constrained()->restrictOnDelete();
            $table->string('description', 500);
            $table->decimal('original_amount', 12, 2);
            $table->decimal('monthly_interest_rate', 7, 4)->default(0);
            $table->date('issued_at');
            $table->date('due_at');
            $table->date('paid_at')->nullable();
            $table->decimal('paid_amount', 14, 2)->nullable();
            $table->decimal('paid_interest', 14, 2)->nullable();
            $table->timestamps();
            foreach (['issued_at', 'due_at', 'paid_at'] as $date) {
                $table->index([$date, 'id']);
                $table->index(['customer_id', $date, 'id']);
            }
            $table->index(['paid_at', 'due_at', 'id']);
            $table->index(['original_amount', 'id']);
        });
        Schema::create('report_exports', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('format', 3);
            $table->string('status', 20)->default('queued');
            $table->json('filters');
            $table->date('as_of');
            $table->json('totals')->nullable();
            $table->unsignedBigInteger('processed_rows')->default(0);
            $table->string('path')->nullable();
            $table->string('error')->nullable();
            $table->timestamp('expires_at');
            $table->timestamps();
            $table->index(['user_id', 'created_at']);
            $table->index('expires_at');
        });
        Schema::create('report_export_rows', function (Blueprint $table) {
            $table->id();
            $table->foreignUuid('export_id')->constrained('report_exports')->cascadeOnDelete();
            $table->unsignedBigInteger('charge_id');
            $table->string('customer_name');
            $table->string('description', 500);
            $table->date('issued_at');
            $table->date('due_at');
            $table->date('paid_at')->nullable();
            $table->string('status', 20);
            $table->decimal('original_amount', 12, 2);
            $table->decimal('interest', 14, 2);
            $table->decimal('updated_amount', 14, 2);
            $table->decimal('paid_amount', 14, 2);
            $table->unique(['export_id', 'charge_id']);
            foreach (['issued_at', 'due_at', 'original_amount'] as $sort) {
                $table->index(['export_id', $sort, 'charge_id'], 'export_rows_'.$sort);
            }
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('report_export_rows');
        Schema::dropIfExists('report_exports');
        Schema::dropIfExists('charges');
        Schema::dropIfExists('customers');
    }
};
