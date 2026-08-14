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
            if (! Schema::hasColumn('charges', 'paid_amount')) {
                $table->decimal('paid_amount', 10, 2)->nullable()->after('interest_rate');
            }

            if (! Schema::hasColumn('charges', 'paid_interest')) {
                $table->decimal('paid_interest', 10, 2)->nullable()->after('paid_amount');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('charges', function (Blueprint $table) {
            if (Schema::hasColumn('charges', 'paid_interest')) {
                $table->dropColumn('paid_interest');
            }

            if (Schema::hasColumn('charges', 'paid_amount')) {
                $table->dropColumn('paid_amount');
            }
        });
    }
};
