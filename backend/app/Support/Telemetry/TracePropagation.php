<?php

namespace App\Support\Telemetry;

use Keepsuit\LaravelOpenTelemetry\Facades\Tracer;
use OpenTelemetry\Context\Context;
use OpenTelemetry\Context\ContextInterface;
use PhpAmqpLib\Message\AMQPMessage;
use PhpAmqpLib\Wire\AMQPTable;

final class TracePropagation
{
    public static function injectIntoMessage(AMQPMessage $message): void
    {
        $headers = Tracer::propagationHeaders();

        if ($headers === []) {
            return;
        }

        $message->set('application_headers', new AMQPTable($headers));
    }

    public static function extractFromMessage(AMQPMessage $message): ContextInterface
    {
        $table = $message->get('application_headers');

        if (! $table instanceof AMQPTable) {
            return Context::getCurrent();
        }

        $headers = [];

        foreach ($table->getNativeData() as $key => $value) {
            $headers[(string) $key] = is_scalar($value) ? (string) $value : '';
        }

        if ($headers === []) {
            return Context::getCurrent();
        }

        return Tracer::extractContextFromPropagationHeaders($headers);
    }
}
