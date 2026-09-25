<?php

namespace Tests\MySql;

use App\Models\Charge;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Symfony\Component\Process\InputStream;
use Symfony\Component\Process\Process;
use Tests\TestCase;

class ChargeConcurrencyTest extends TestCase
{
    private array $workers = [];

    private Charge $charge;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->assertSame('1', (string) getenv('MYSQL_CONCURRENCY_TESTS'), 'Explicit opt-in required before migrate:fresh.');
        $this->assertSame('mysql', getenv('DB_CONNECTION'), 'Set DB_CONNECTION=mysql explicitly.');
        $this->assertSame('clara_test', getenv('DB_DATABASE'), 'Refusing to reset a non-test database. Set DB_DATABASE=clara_test explicitly.');
        $this->assertEmpty(getenv('DB_URL'), 'DB_URL must be unset or empty for this suite.');
        foreach (['host' => 'DB_HOST', 'port' => 'DB_PORT', 'username' => 'DB_USERNAME'] as $key => $variable) {
            $this->assertNotEmpty(getenv($variable), 'Set '.$variable.' explicitly; do not inherit development credentials.');
            config(['database.connections.mysql.'.$key => getenv($variable)]);
        }
        config(['database.connections.mysql.password' => getenv('DB_PASSWORD') ?: '', 'database.connections.mysql.url' => null]);
        DB::purge('mysql');
        $this->assertSame('mysql', DB::getDriverName(), 'This suite must never run in SQLite.');
        $this->assertSame('clara_test', DB::connection()->getDatabaseName(), 'Refusing to reset a non-test database.');
        try {
            foreach (['data_lock_waits', 'data_locks', 'threads'] as $table) {
                DB::select('SELECT * FROM performance_schema.'.$table.' LIMIT 1');
            }
        } catch (QueryException $exception) {
            $this->fail('MySQL lock instrumentation unavailable. Enable performance_schema and grant SELECT on performance_schema.data_lock_waits, data_locks and threads to the test user. SQLSTATE: '.$exception->getCode());
        }
        $this->travelTo(Carbon::parse('2026-09-21 12:00:00', 'America/Sao_Paulo'));
        Artisan::call('migrate:fresh', ['--force' => true]);
        $engine = DB::selectOne("SELECT ENGINE AS engine FROM information_schema.tables WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'charges'");
        $this->assertSame('InnoDB', $engine->engine);
        $environment = DB::selectOne('SELECT VERSION() AS version, DATABASE() AS db, @@port AS port, @@transaction_isolation AS isolation_level, CONNECTION_ID() AS observer');
        $this->assertSame('REPEATABLE-READ', $environment->isolation_level);
        $this->record('environment', (array) $environment);
        $this->user = User::factory()->create();
        $this->charge = Charge::factory()->create([
            'description' => 'Original', 'original_amount' => '1000.00', 'monthly_interest_rate' => '2.0000',
            'issued_at' => '2026-08-01', 'due_at' => '2026-08-21',
        ]);
        $this->charge->refresh();
    }

    protected function tearDown(): void
    {
        $errors = [];
        try {
            foreach ($this->workers as $worker) {
                try {
                    try {
                        $worker->input->close();
                    } finally {
                        $worker->process->stop(0);
                    }
                } catch (\Throwable $exception) {
                    $errors[] = $exception;
                }
            }
        } finally {
            DB::disconnect();
            parent::tearDown();
        }
        if ($errors !== []) {
            throw $errors[0];
        }
    }

    public function test_only_one_concurrent_payment_is_persisted(): void
    {
        [$winner, $loser] = $this->race('payment', 'payment');
        $this->assertSame(200, $winner['status']);
        $this->assertSame(409, $loser['status']);
        $this->assertStringContainsString('já foi paga', $loser['body']['message']);
        $this->assertPayment('2026-09-20', '910.00', '20.00');
        $this->assertSame(1, Charge::whereNotNull('paid_at')->count());
        $this->assertSame('paid', $winner['body']['status']);
    }

    public function test_edit_started_before_payment_cannot_overwrite_the_paid_charge(): void
    {
        // The edit process binds the unpaid model first, but payment acquires the lock first.
        [$winner, $loser] = $this->race('payment', 'edit', bindSecondFirst: true);
        $this->assertSame(200, $winner['status']);
        $this->assertSame(409, $loser['status']);
        $this->assertStringContainsString('não pode ser editada', $loser['body']['message']);
        $this->assertPayment('2026-09-20', '910.00', '20.00');
        $this->assertSame('Original', $this->charge->fresh()->description);
        $this->assertSame('1000.00', $this->charge->fresh()->original_amount);
        $this->assertSame('2.0000', $this->charge->fresh()->monthly_interest_rate);
        $this->assertSame('2026-08-21', $this->charge->fresh()->due_at);
    }

    public function test_payment_waits_for_edit_and_calculates_using_committed_values(): void
    {
        [$edit, $payment] = $this->race('edit', 'payment');
        $this->assertSame(200, $edit['status']);
        $this->assertSame(200, $payment['status']);
        $this->assertSame('Editada', $this->charge->fresh()->description);
        $this->assertSame('2000.00', $this->charge->fresh()->original_amount);
        $this->assertSame('3.0000', $this->charge->fresh()->monthly_interest_rate);
        $this->assertSame('2026-09-01', $this->charge->fresh()->due_at);
        $this->assertPayment('2026-09-21', '920.00', '40.00');
    }

    public function test_exception_rolls_back_payment_and_releases_lock_for_waiter(): void
    {
        [$failed, $payment] = $this->race('payment', 'payment', rollback: true);
        $this->assertSame(500, $failed['status']);
        $this->assertTrue($failed['fault_injected']);
        $this->assertSame(\RuntimeException::class, $failed['errors'][0]['class']);
        $this->assertSame('Controlled failure after UPDATE and before COMMIT.', $failed['errors'][0]['message']);
        $this->assertSame(200, $payment['status']);
        $this->assertPayment('2026-09-21', '920.00', '20.67');
    }

    private function assertPayment(string $date, string $amount, string $interest): void
    {
        $charge = $this->charge->fresh();
        $this->assertSame($date, $charge->paid_at);
        $this->assertSame($amount, $charge->paid_amount);
        $this->assertSame($interest, $charge->paid_interest);
    }

    private function race(string $first, string $second, bool $bindSecondFirst = false, bool $rollback = false): array
    {
        if ($bindSecondFirst) {
            $b = $this->startWorker($second, 2);
            $this->event($b, 'bound');
            $a = $this->startWorker($first, 1, $rollback);
        } else {
            $a = $this->startWorker($first, 1, $rollback);
            $this->event($a, 'bound');
            $b = $this->startWorker($second, 2);
        }
        $this->assertSame(0, $this->event($a, 'bound')['transaction_level']);
        $this->assertSame(0, $this->event($b, 'bound')['transaction_level']);
        $aId = $this->event($a, 'connected')['connection'];
        $bId = $this->event($b, 'connected')['connection'];
        $this->assertNotSame($aId, $bId);
        $observer = (int) DB::selectOne('SELECT CONNECTION_ID() AS id')->id;
        $this->assertNotContains($observer, [$aId, $bId]);
        $this->assertSame('REPEATABLE-READ', $this->event($a, 'connected')['isolation']);
        $this->assertSame('REPEATABLE-READ', $this->event($b, 'connected')['isolation']);

        $this->release($a);
        $this->assertSame(1, $this->event($a, 'locked')['transaction_level']);
        $this->release($b);
        $wait = null;
        $this->until(function () use ($a, $b, $aId, $bId, &$wait): bool {
            $this->read($a);
            $this->read($b);
            if (isset($b->events['result'])) {
                $this->fail('Second operation finished instead of waiting for the row lock: '.json_encode($b->events['result']));
            }
            $wait = DB::selectOne('SELECT r.PROCESSLIST_ID AS waiting_connection,
                b.PROCESSLIST_ID AS blocking_connection,
                w.REQUESTING_ENGINE_TRANSACTION_ID AS waiting_transaction,
                w.BLOCKING_ENGINE_TRANSACTION_ID AS blocking_transaction,
                l.OBJECT_NAME AS locked_table, l.LOCK_MODE AS lock_mode, l.LOCK_TYPE AS lock_type
                FROM performance_schema.data_lock_waits w
                JOIN performance_schema.threads r ON r.THREAD_ID = w.REQUESTING_THREAD_ID
                JOIN performance_schema.threads b ON b.THREAD_ID = w.BLOCKING_THREAD_ID
                JOIN performance_schema.data_locks l
                  ON l.ENGINE_LOCK_ID = w.REQUESTING_ENGINE_LOCK_ID AND l.ENGINE = w.ENGINE
                WHERE r.PROCESSLIST_ID = ? AND b.PROCESSLIST_ID = ? AND l.OBJECT_NAME = ?', [$bId, $aId, 'charges']);

            return $wait !== null;
        }, 'MySQL did not report the expected charges row-lock wait.');
        $this->assertSame('RECORD', $wait->lock_type);
        $this->assertNotSame($wait->blocking_transaction, $wait->waiting_transaction);
        $this->record('lock_wait', (array) $wait);
        $this->release($a);
        $firstResult = $this->event($a, 'result');
        $this->assertSame(0, $firstResult['transaction_level']);
        $this->assertSame(1, $this->event($b, 'locked')['transaction_level']);
        if ($rollback) {
            // B owns the released lock but has not written yet. Observer must see no partial A payment.
            $this->assertSame($this->charge->getAttributes(), $this->charge->fresh()->getAttributes());
            $this->assertNull($this->charge->fresh()->paid_at);
            $this->assertNull($this->charge->fresh()->paid_amount);
            $this->assertNull($this->charge->fresh()->paid_interest);
            $this->assertSame('1000.00', $this->charge->fresh()->original_amount);
        }
        $this->release($b);
        $secondResult = $this->event($b, 'result');
        $this->assertSame(0, $secondResult['transaction_level']);
        if (! $rollback) {
            $this->assertSame([], $firstResult['errors']);
        }
        $this->assertSame([], $secondResult['errors'], json_encode($secondResult));
        foreach ([$a, $b] as $worker) {
            $worker->input->close();
            $this->assertSame(0, $worker->process->wait(), $worker->process->getErrorOutput());
        }
        $this->record('results', ['first' => $firstResult['status'], 'second' => $secondResult['status'], 'rollback' => $rollback]);

        return [$firstResult, $secondResult];
    }

    private function startWorker(string $operation, int $number, bool $rollback = false): object
    {
        $payload = $operation === 'payment'
            ? ['paid_at' => $number === 1 ? '2026-09-20' : '2026-09-21', 'paid_amount' => $number === 1 ? '910.00' : '920.00']
            : ['customer_id' => $this->charge->customer_id, 'description' => 'Editada', 'original_amount' => '2000.00', 'monthly_interest_rate' => '3.0000', 'issued_at' => '2026-08-01', 'due_at' => '2026-09-01'];
        $spec = ['user_id' => $this->user->id, 'uri' => '/api/charges/'.$this->charge->id.($operation === 'payment' ? '/payment' : ''), 'method' => $operation === 'payment' ? 'POST' : 'PUT', 'payload' => $payload, 'rollback' => $rollback];
        $config = config('database.connections.mysql');
        $env = [
            'MYSQL_CONCURRENCY_TESTS' => '1',
            'APP_ENV' => 'testing', 'APP_DEBUG' => 'false', 'APP_KEY' => config('app.key'),
            'DB_CONNECTION' => 'mysql', 'DB_HOST' => $config['host'], 'DB_PORT' => (string) $config['port'],
            'DB_DATABASE' => 'clara_test', 'DB_USERNAME' => $config['username'], 'DB_PASSWORD' => $config['password'], 'DB_URL' => '',
            'SESSION_DRIVER' => 'array', 'CACHE_STORE' => 'array', 'QUEUE_CONNECTION' => 'sync',
        ];
        $input = new InputStream;
        $process = new Process([PHP_BINARY, base_path('tests/Support/charge-worker.php'), json_encode($spec, JSON_THROW_ON_ERROR)], base_path(), $env, $input, 60);
        $worker = (object) ['process' => $process, 'input' => $input, 'buffer' => '', 'events' => []];
        $this->workers[] = $worker;
        $process->start();

        return $worker;
    }

    private function release(object $worker): void
    {
        $worker->input->write("continue\n");
        $this->read($worker);
    }

    private function event(object $worker, string $name): array
    {
        $this->until(function () use ($worker, $name): bool {
            $this->read($worker);
            if (! isset($worker->events[$name]) && ! $worker->process->isRunning()) {
                $this->fail('Worker exited before '.$name.': '.$worker->process->getErrorOutput().' '.json_encode($worker->events));
            }

            return isset($worker->events[$name]);
        }, 'Timed out at worker barrier: '.$name);

        return $worker->events[$name];
    }

    private function read(object $worker): void
    {
        $worker->buffer .= $worker->process->getIncrementalOutput();
        while (($end = strpos($worker->buffer, "\n")) !== false) {
            $line = trim(substr($worker->buffer, 0, $end));
            $worker->buffer = substr($worker->buffer, $end + 1);
            if ($line !== '') {
                $event = json_decode($line, true, flags: JSON_THROW_ON_ERROR);
                $worker->events[$event['event']] = $event;
            }
        }
    }

    private function until(callable $condition, string $failure): void
    {
        $deadline = hrtime(true) + 15_000_000_000;
        do {
            if ($condition()) {
                return;
            }
            usleep(10_000);
        } while (hrtime(true) < $deadline);
        $this->fail($failure);
    }

    private function record(string $event, array $details): void
    {
        fwrite(STDERR, 'MYSQL_CONCURRENCY '.json_encode(['test' => $this->name(), 'event' => $event, ...$details], JSON_THROW_ON_ERROR).PHP_EOL);
    }
}
