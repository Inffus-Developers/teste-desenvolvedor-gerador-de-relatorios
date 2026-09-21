<?php

namespace App\Http\Controllers;

use App\Http\Requests\ReportRequest;
use App\Jobs\GenerateReport;
use App\Models\ReportExport;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class ExportController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        return response()->json(ReportExport::where('user_id', $request->user()->id)->latest()->limit(20)->get());
    }

    public function store(ReportRequest $request): JsonResponse
    {
        $request->validate(['format' => 'required|in:csv,pdf']);
        $export = DB::transaction(function () use ($request) {
            User::whereKey($request->user()->id)->lockForUpdate()->firstOrFail();
            $active = ReportExport::where('user_id', $request->user()->id)->whereIn('status', ['queued', 'processing'])->count();
            abort_if($active >= 2, 429, 'Aguarde a conclusão das exportações em andamento.');
            $export = ReportExport::create([
                'user_id' => $request->user()->id, 'format' => $request->input('format'),
                'filters' => $request->filters(), 'as_of' => today()->toDateString(), 'expires_at' => now()->addDay(),
            ]);
            GenerateReport::dispatch($export->id)->afterCommit();

            return $export;
        });

        return response()->json($export, 202);
    }

    public function download(Request $request, ReportExport $export): BinaryFileResponse
    {
        abort_unless($export->user_id === $request->user()->id, 404);
        abort_if($export->expires_at->isPast(), 410, 'Esta exportação expirou. Gere um novo arquivo.');
        abort_unless($export->status === 'completed' && $export->path, 409, 'O arquivo ainda não está disponível.');
        abort_unless(Storage::disk('local')->exists($export->path), 404);

        return response()->download(Storage::disk('local')->path($export->path), 'faturamento-'.substr($export->id, -8).'.'.pathinfo($export->path, PATHINFO_EXTENSION), [
            'Cache-Control' => 'private, no-store', 'X-Content-Type-Options' => 'nosniff',
        ]);
    }
}
