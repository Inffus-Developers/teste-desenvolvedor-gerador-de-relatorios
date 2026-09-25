<?php

use App\Models\Charge;
use App\Models\User;
use Carbon\Carbon;
use Carbon\CarbonImmutable;
use Illuminate\Contracts\Debug\ExceptionHandler;
use Illuminate\Contracts\Http\Kernel;
use Illuminate\Database\Events\QueryExecuted;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

require getcwd().'/vendor/autoload.php';
$app = require getcwd().'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
if (getenv('MYSQL_CONCURRENCY_TESTS') !== '1' || DB::getDriverName() !== 'mysql' || DB::connection()->getDatabaseName() !== 'clara_test') {
    throw new RuntimeException('Worker requires MySQL and isolated database clara_test.');
}
try {
    Carbon::setTestNow(Carbon::parse('2026-09-21 12:00:00', 'America/Sao_Paulo'));
    CarbonImmutable::setTestNow(Carbon::now());
    $spec = json_decode($argv[1], true, flags: JSON_THROW_ON_ERROR);
    $emit = static function (array $event): void {
        echo json_encode($event, JSON_THROW_ON_ERROR).PHP_EOL;
        fflush(STDOUT);
    };
    $barrier = static function (): void {
        if (trim((string) fgets(STDIN)) !== 'continue') {
            throw new RuntimeException('Coordinator closed the synchronization channel.');
        }
    };
    $connection = DB::selectOne('SELECT CONNECTION_ID() AS id, @@transaction_isolation AS isolation_level');
    $emit(['event' => 'connected', 'connection' => (int) $connection->id, 'isolation' => $connection->isolation_level]);
    Auth::guard('web')->setUser(User::findOrFail($spec['user_id']));
    $bound = false;
    DB::listen(static function (QueryExecuted $query) use (&$bound, $emit, $barrier): void {
        $sql = strtolower($query->sql);
        if (! str_starts_with($sql, 'select') || ! str_contains($sql, '`charges`')) {
            return;
        }
        if (! $bound && ! str_contains($sql, 'for update')) {
            $bound = true;
            $emit(['event' => 'bound', 'transaction_level' => DB::transactionLevel()]);
            $barrier();
        } elseif (str_contains($sql, 'for update')) {
            $emit(['event' => 'locked', 'transaction_level' => DB::transactionLevel()]);
            $barrier();
        }
    });
    $faultInjected = false;
    if ($spec['rollback'] ?? false) {
        Charge::updated(static function () use (&$faultInjected): void {
            $faultInjected = true;
            throw new RuntimeException('Controlled failure after UPDATE and before COMMIT.');
        });
    }
    $errors = [];
    $app->make(ExceptionHandler::class)->reportable(static function (Throwable $exception) use (&$errors): void {
        $errors[] = ['class' => $exception::class, 'code' => $exception->getCode(), 'message' => $exception->getMessage()];
    });
    $request = Request::create($spec['uri'], $spec['method'], [], [], [], [
        'HTTP_ACCEPT' => 'application/json', 'CONTENT_TYPE' => 'application/json',
    ], json_encode($spec['payload'], JSON_THROW_ON_ERROR));
    $kernel = $app->make(Kernel::class);
    $response = $kernel->handle($request);
    $emit([
        'event' => 'result', 'status' => $response->getStatusCode(),
        'body' => json_decode($response->getContent(), true), 'fault_injected' => $faultInjected,
        'transaction_level' => DB::transactionLevel(), 'errors' => $errors,
    ]);
    $kernel->terminate($request, $response);
} finally {
    try {
        if (DB::transactionLevel() > 0) {
            DB::rollBack(0);
        }
    } finally {
        DB::disconnect();
    }
}
