<?php

namespace App\Console\Commands;

use App\Models\ReportExport;
use App\Services\ReportExportProcessor;
use App\Services\ReportExportQueue;
use App\Support\Telemetry\TracePropagation;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;
use Keepsuit\LaravelOpenTelemetry\Facades\Tracer;
use PhpAmqpLib\Message\AMQPMessage;

class ConsumeReportExports extends Command
{
    protected $signature = 'reports:consume-exports';

    protected $description = 'Consume report export jobs from RabbitMQ';

    public function handle(ReportExportQueue $queue, ReportExportProcessor $processor): int
    {
        $this->info('Listening for report export jobs on RabbitMQ…');

        $queue->consume(function (AMQPMessage $message) use ($processor, $queue): void {
            $parentContext = TracePropagation::extractFromMessage($message);

            Tracer::newSpan('report.export.consume')
                ->setParent($parentContext)
                ->setAttribute('messaging.system', 'rabbitmq')
                ->measure(function () use ($message, $processor, $queue): void {
                    $exportId = $queue->decodeExportId($message);
                    $export = ReportExport::query()->findOrFail($exportId);

                    Log::info('Processing report export job.', [
                        'export_id' => $export->id,
                        'format' => $export->format,
                    ]);

                    $processor->process($export);

                    Log::info('Report export job completed.', [
                        'export_id' => $export->id,
                        'format' => $export->format,
                    ]);
                });
        });

        return self::SUCCESS;
    }
}
