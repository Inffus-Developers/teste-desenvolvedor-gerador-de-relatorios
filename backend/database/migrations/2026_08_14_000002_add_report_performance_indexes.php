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
        Schema::table('charges', function (Blueprint $table) {
            $table->index('client_name', 'charges_client_name_index');
            $table->index('issue_date', 'charges_issue_date_index');
            $table->index('due_date', 'charges_due_date_index');
            $table->index('payment_date', 'charges_payment_date_index');
            $table->index(['status', 'issue_date'], 'charges_status_issue_date_index');
            $table->index(['status', 'due_date'], 'charges_status_due_date_index');
            $table->index(['status', 'payment_date'], 'charges_status_payment_date_index');
        });

        Schema::table('clients', function (Blueprint $table) {
            $table->index('status', 'clients_status_index');
            $table->index('email', 'clients_email_index');
            $table->index('name', 'clients_name_index');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('charges', function (Blueprint $table) {
            $table->dropIndex('charges_client_name_index');
            $table->dropIndex('charges_issue_date_index');
            $table->dropIndex('charges_due_date_index');
            $table->dropIndex('charges_payment_date_index');
            $table->dropIndex('charges_status_issue_date_index');
            $table->dropIndex('charges_status_due_date_index');
            $table->dropIndex('charges_status_payment_date_index');
        });

        Schema::table('clients', function (Blueprint $table) {
            $table->dropIndex('clients_status_index');
            $table->dropIndex('clients_email_index');
            $table->dropIndex('clients_name_index');
        });
    }
};
