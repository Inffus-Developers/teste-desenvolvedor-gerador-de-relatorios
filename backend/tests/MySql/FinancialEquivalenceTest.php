<?php

namespace Tests\MySql;

use App\Models\Charge;
use App\Models\Customer;
use App\Models\User;
use App\Services\BillingReport;
use App\Services\InterestCalculator;
use Brick\Math\BigDecimal;
use Brick\Math\BigInteger;
use Carbon\Carbon;
use DateTimeImmutable;
use DateTimeZone;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use PHPUnit\Framework\AssertionFailedError;
use Random\Engine\Mt19937;
use Random\Randomizer;
use Tests\TestCase;

class FinancialEquivalenceTest extends TestCase
{
    private const AS_OF = '2026-09-21';

    private int $customerId;

    protected function setUp(): void
    {
        parent::setUp();
        $this->assertSame('1', getenv('MYSQL_FINANCIAL_TESTS'), 'Explicit financial-test opt-in required before migrate:fresh.');
        $this->assertSame('mysql', getenv('DB_CONNECTION'));
        $this->assertSame('clara_test', getenv('DB_DATABASE'), 'Refusing to reset a non-test database.');
        $this->assertEmpty(getenv('DB_URL'));
        foreach (['host' => 'DB_HOST', 'port' => 'DB_PORT', 'username' => 'DB_USERNAME'] as $key => $variable) {
            $this->assertNotEmpty(getenv($variable), 'Set '.$variable.' explicitly.');
            config(['database.connections.mysql.'.$key => getenv($variable)]);
        }
        config(['database.connections.mysql.password' => getenv('DB_PASSWORD') ?: '', 'database.connections.mysql.url' => null]);
        DB::purge('mysql');
        $this->assertSame('mysql', DB::getDriverName());
        $this->assertSame('clara_test', DB::connection()->getDatabaseName());
        $this->travelTo(Carbon::parse(self::AS_OF.' 12:00:00', 'America/Sao_Paulo'));
        Artisan::call('migrate:fresh', ['--force' => true]);
        $this->actingAs(User::factory()->create());
        $this->customerId = Customer::factory()->create()->id;
    }

    protected function tearDown(): void
    {
        try {
            DB::disconnect();
        } finally {
            parent::tearDown();
        }
    }

    public function test_boundary_matrix_matches_php_sql_individual_and_aggregated_cents(): void
    {
        $amounts = ['0.01', '0.05', '0.14', '0.15', '0.16', '1.00', '99.99', '1000.00', '4224.10', '99999999.99', '9999999999.99'];
        $rates = ['0', '0.0001', '0.0123', '1.2345', '2', '5', '99.9999', '100'];
        $delays = [-30, -1, 0, 1, 2, 29, 30, 31, 59, 60, 61, 365, 9760];
        $cases = [];
        foreach ($amounts as $amount) {
            foreach ($rates as $rate) {
                foreach ($delays as $days) {
                    $cases[] = ['amount' => $amount, 'rate' => $rate, 'due' => $this->due($days)];
                }
            }
        }
        $this->assertCount(1144, $cases);
        $this->corpus($cases, 'boundaries');
    }

    public function test_seeded_matrix_is_reproducible_including_historical_payments(): void
    {
        $random = new Randomizer(new Mt19937(20260925));
        $cases = [];
        for ($i = 0; $i < 1000; $i++) {
            $case = [
                'amount' => $this->decimal($random->getInt(1, 9999999999), 2),
                'rate' => $this->decimal($random->getInt(0, 1000000), 4),
                'due' => $this->due($random->getInt(-30, 9760)),
            ];
            if ($i % 4 === 0) {
                $case['paid_at'] = $this->due($random->getInt(0, 30));
                $case['paid_amount'] = $this->decimal($random->getInt(1, 9999999999), 2);
            }
            $cases[] = $case;
        }
        $this->corpus($cases, 'seed-20260925');
    }

    public function test_calendar_boundaries_use_whole_days_and_half_cent_is_rounded_per_row(): void
    {
        $dates = [
            ['2024-02-28', '2024-02-29', 1], ['2024-02-28', '2024-03-01', 2],
            ['2024-02-29', '2024-03-01', 1], ['2023-02-28', '2023-03-01', 1],
            ['2025-12-31', '2026-01-01', 1], ['2026-01-31', '2026-02-01', 1],
            ['2026-09-21', '2026-09-21', 0], ['2026-09-22', '2026-09-21', 0],
        ];
        foreach ($dates as [$due, $asOf, $days]) {
            $this->travelTo(Carbon::parse($asOf.' 12:00:00', 'America/Sao_Paulo'));
            $case = ['amount' => '3000.00', 'rate' => '1', 'due' => $due];
            $id = $this->insert($case);
            $this->assertSame((string) ($days * 100), $this->oracle($case, $asOf));
            $this->verify($id, $case, $asOf, json_encode($case));
        }
        $this->travelTo(Carbon::parse(self::AS_OF.' 12:00:00', 'America/Sao_Paulo'));
        $rows = [];
        foreach (['0.14', '0.15', '0.16'] as $amount) {
            $case = ['amount' => $amount, 'rate' => '100', 'due' => $this->due(1)];
            $id = $this->insert($case);
            $rows[$id] = $this->verify($id, $case, self::AS_OF, 'half-cent-'.$amount);
        }
        $this->assertSame(['0', '1', '1'], array_column(array_values($rows), 'interest'));
        $this->assertTotals($rows, self::AS_OF, 'round before sum');
    }

    public function test_paid_amount_is_independent_from_frozen_interest_and_updated_amount(): void
    {
        $cases = [];
        foreach (['2026-08-22', '2026-09-06', self::AS_OF] as $paidAt) {
            $case = ['amount' => '1000.00', 'rate' => '2', 'due' => '2026-08-22', 'paid_at' => $paidAt];
            $updated = BigInteger::of('100000')->plus($this->oracle($case, $paidAt));
            foreach ([-1000, 0, 1000] as $adjustment) {
                $cases[] = [...$case, 'paid_amount' => (string) BigDecimal::ofUnscaledValue($updated->plus($adjustment), 2)];
            }
        }
        $cases[] = ['amount' => '1000.00', 'rate' => '2', 'due' => self::AS_OF, 'paid_at' => self::AS_OF, 'paid_amount' => '999999999999.99'];
        $rows = [];
        foreach ($cases as $index => $case) {
            $id = $this->insert($case);
            $this->pay($id, $case);
            $expected = $this->verify($id, $case, self::AS_OF, 'payment-'.$index);
            $this->travelTo(Carbon::parse('2028-03-01 12:00:00', 'America/Sao_Paulo'));
            $rows[$id] = $this->verify($id, $case, '2028-03-01', 'frozen-payment-'.$index);
            $this->assertSame($expected, $rows[$id]);
            $this->travelTo(Carbon::parse(self::AS_OF.' 12:00:00', 'America/Sao_Paulo'));
        }
        $this->assertTotals($rows, '2028-03-01', 'paid mixed discounts');
    }

    public function test_midnight_dst_transition_counts_one_calendar_day(): void
    {
        $this->travelTo(Carbon::parse('2016-10-17 12:00:00', 'America/Sao_Paulo'));
        $case = ['amount' => '0.15', 'rate' => '100', 'due' => '2016-10-16'];
        $this->assertSame('1', $this->oracle($case, '2016-10-17'));
        $this->verify($this->insert($case), $case, '2016-10-17', 'DST midnight: 2016-10-16 to 2016-10-17');
    }

    public function test_payment_across_midnight_dst_freezes_one_day_of_interest(): void
    {
        $this->travelTo(Carbon::parse('2016-10-17 12:00:00', 'America/Sao_Paulo'));
        $case = ['amount' => '1000.00', 'rate' => '2', 'due' => '2016-10-16', 'paid_at' => '2016-10-17', 'paid_amount' => '1000.67'];
        $this->pay($this->insert($case), $case);
    }

    public function test_mixed_report_sums_rounded_rows_and_received_amounts(): void
    {
        $this->corpus([
            ['amount' => '99.99', 'rate' => '5', 'due' => $this->due(-1)],
            ['amount' => '1.00', 'rate' => '100', 'due' => self::AS_OF],
            ['amount' => '1000.00', 'rate' => '2', 'due' => $this->due(31)],
            ['amount' => '0.15', 'rate' => '100', 'due' => $this->due(1)],
            ['amount' => '0.15', 'rate' => '100', 'due' => $this->due(1)],
            ['amount' => '1000.00', 'rate' => '2', 'due' => '2026-08-22', 'paid_at' => '2026-09-06', 'paid_amount' => '990.00'],
            ['amount' => '1000.00', 'rate' => '2', 'due' => '2026-08-22', 'paid_at' => '2026-09-06', 'paid_amount' => '1050.00'],
        ], 'mixed-statuses');
        $report = $this->getJson('/api/reports/billing?per_page=1')->assertOk()->json();
        $this->assertCount(1, $report['rows']['data']);
        $this->assertSame(7, $report['totals']['count']);
        $this->assertSame('204000', $this->cents($report['totals']['received_amount']));
        $this->assertSame('4069', $this->cents($report['totals']['interest']));
    }

    public function test_rounding_is_independent_of_numeric_and_application_locales(): void
    {
        $original = setlocale(LC_NUMERIC, '0');
        $appLocale = app()->getLocale();
        $checked = [];
        $case = ['amount' => '4224.10', 'rate' => '5', 'due' => $this->due(30)];
        $id = $this->insert($case);
        try {
            foreach (['C', 'pt_BR.UTF-8', 'Portuguese_Brazil.1252', 'de_DE.UTF-8', 'German_Germany.1252'] as $locale) {
                if (setlocale(LC_NUMERIC, $locale) === false) {
                    continue;
                }
                app()->setLocale('pt_BR');
                $expected = $this->verify($id, $case, self::AS_OF, 'locale-'.$locale);
                $this->assertSame('21121', $expected['interest']);
                $checked[$locale] = localeconv()['decimal_point'];
            }
            $this->assertContains(',', $checked, 'Install at least one comma-decimal locale to verify this property.');
            fwrite(STDERR, 'FINANCIAL_LOCALES '.json_encode($checked).PHP_EOL);
        } finally {
            setlocale(LC_NUMERIC, $original);
            app()->setLocale($appLocale);
        }
    }

    private function corpus(array $cases, string $label): void
    {
        $rows = [];
        $failures = [];
        foreach ($cases as $index => $case) {
            $id = $this->insert($case);
            try {
                if (isset($case['paid_at'])) {
                    $this->pay($id, $case);
                }
                $rows[$id] = $this->verify($id, $case, self::AS_OF, $label.' #'.$index.' '.json_encode($case));
            } catch (AssertionFailedError $failure) {
                $reference = $case['paid_at'] ?? self::AS_OF;
                $failures[] = [
                    'index' => $index, 'case' => $case, 'reference' => $reference,
                    'expected_cents' => $this->oracle($case, $reference),
                    'php' => app(InterestCalculator::class)->calculate($case['amount'], $case['rate'], $case['due'], $reference),
                    'sql' => app(BillingReport::class)->query([], self::AS_OF)->where('charges.id', $id)->first()->interest,
                    'failure' => $failure->getMessage(),
                ];
            }
        }
        fwrite(STDERR, 'FINANCIAL_CORPUS '.json_encode(['label' => $label, 'cases' => count($cases), 'failures' => $failures]).PHP_EOL);
        $this->assertSame([], $failures, 'Every case was attempted; exact mismatches: '.json_encode($failures));
        $this->assertTotals($rows, self::AS_OF, $label);
    }

    private function insert(array $case): int
    {
        return DB::table('charges')->insertGetId([
            'customer_id' => $this->customerId, 'description' => 'Financial matrix',
            'original_amount' => $case['amount'], 'monthly_interest_rate' => $case['rate'],
            'issued_at' => '2000-01-01', 'due_at' => $case['due'],
            'created_at' => now(), 'updated_at' => now(),
        ]);
    }

    private function pay(int $id, array $case): void
    {
        $this->postJson('/api/charges/'.$id.'/payment', [
            'paid_at' => $case['paid_at'], 'paid_amount' => $case['paid_amount'],
        ])->assertOk()->assertJsonPath('status', 'paid');
        $this->assertSame($this->oracle($case, $case['paid_at']), $this->cents(Charge::findOrFail($id)->paid_interest), json_encode($case));
    }

    private function verify(int $id, array $case, string $asOf, string $context): array
    {
        $reference = $case['paid_at'] ?? $asOf;
        $interest = $this->oracle($case, $reference);
        $php = app(InterestCalculator::class)->calculate($case['amount'], $case['rate'], $case['due'], $reference);
        $this->assertSame($interest, $this->cents($php), 'PHP '.$context);
        $original = $this->cents($case['amount']);
        $updated = (string) BigInteger::of($original)->plus($interest);
        $expected = [
            'original_amount' => $original, 'interest' => $interest, 'updated_amount' => $updated,
            'received_amount' => $this->cents($case['paid_amount'] ?? '0.00'),
            'pending_amount' => isset($case['paid_at']) ? '0' : $updated,
        ];
        $report = app(BillingReport::class);
        $query = $report->query([], $asOf)->where('charges.id', $id);
        $sql = (clone $query)->first();
        $individual = $this->getJson('/api/charges/'.$id)->assertOk()->json();
        $status = isset($case['paid_at']) ? 'paid' : ($case['due'] < $asOf ? 'overdue' : 'pending');
        $this->assertSame($status, $sql->status, $context);
        $this->assertSame($status, $individual['status'], $context);
        foreach (['original_amount', 'interest', 'updated_amount'] as $key) {
            $this->assertSame($expected[$key], $this->cents($sql->$key), 'SQL '.$key.' '.$context);
            $this->assertSame($expected[$key], $this->cents($individual[$key]), 'HTTP '.$key.' '.$context);
        }
        $this->assertSame($expected['received_amount'], $this->cents($individual['paid_amount']), $context);
        $totals = $report->totals(clone $query);
        $this->assertSame(1, $totals['count'], $context);
        foreach ($expected as $key => $value) {
            $this->assertSame($value, $this->cents($totals[$key]), 'single total '.$key.' '.$context);
        }

        return $expected;
    }

    private function assertTotals(array $rows, string $asOf, string $context): void
    {
        $report = app(BillingReport::class);
        $totals = $report->totals($report->query([], $asOf)->whereIn('charges.id', array_keys($rows)));
        $this->assertSame(count($rows), $totals['count'], $context);
        foreach (array_keys(reset($rows)) as $key) {
            $sum = BigInteger::zero();
            foreach ($rows as $row) {
                $sum = $sum->plus($row[$key]);
            }
            $this->assertSame((string) $sum, $this->cents($totals[$key]), 'set total '.$key.' '.$context);
        }
    }

    private function oracle(array $case, string $asOf): string
    {
        $utc = new DateTimeZone('UTC');
        $days = max(0, (int) (new DateTimeImmutable($case['due'], $utc))->diff(new DateTimeImmutable($asOf, $utc))->format('%r%a'));
        $rateUnits = BigDecimal::of($case['rate'])->multipliedBy(10000)->toBigInteger();

        // Integer oracle: round half-up cents without decimal division or floating point.
        return (string) BigInteger::of($this->cents($case['amount']))->multipliedBy($rateUnits)
            ->multipliedBy($days)->plus(15000000)->quotient(30000000);
    }

    private function cents(string|int $value): string
    {
        return (string) BigDecimal::of($value)->multipliedBy(100)->toBigInteger();
    }

    private function decimal(int $value, int $scale): string
    {
        return (string) BigDecimal::ofUnscaledValue($value, $scale);
    }

    private function due(int $days): string
    {
        return (new DateTimeImmutable(self::AS_OF))->modify(sprintf('%+d days', -$days))->format('Y-m-d');
    }
}
