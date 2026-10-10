'use client';

import { useState, useEffect, useCallback } from 'react';
import { reportService } from '@/services/report';
import { BillingReportResponse, ReportFilters } from '@/types/report';

export function useBillingReport() {
  const [data, setData] = useState<BillingReportResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState<ReportFilters>({
    start_date: '',
    end_date: '',
    status: '',
    customer_id: '',
    page: 1,
    per_page: 15,
  });

  const fetchReport = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await reportService.getBillingReport(filters);
      setData(res);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao gerar relatório.');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  function handleFilterChange<K extends keyof ReportFilters>(key: K, value: ReportFilters[K]) {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  }

  function handlePageChange(page: number) {
    setFilters((prev) => ({ ...prev, page }));
  }

  async function handleExportCsv() {
    setExporting(true);
    try {
      await reportService.downloadCsv(filters);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Erro ao baixar arquivo CSV.');
    } finally {
      setExporting(false);
    }
  }

  async function handleExportPdf() {
    setExportingPdf(true);
    try {
      await reportService.downloadPdf(filters);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Erro ao baixar arquivo PDF.');
    } finally {
      setExportingPdf(false);
    }
  }

  return {
    reportData: data?.report.data || [],
    summary: data?.summary || {
      total_count: 0,
      total_amount: 0,
      paid_amount: 0,
      pending_amount: 0,
      overdue_amount: 0,
      canceled_amount: 0,
    },
    pagination: {
      currentPage: data?.report.current_page || 1,
      lastPage: data?.report.last_page || 1,
      total: data?.report.total || 0,
      from: data?.report.from || 0,
      to: data?.report.to || 0,
    },
    filters,
    loading,
    exporting,
    exportingPdf,
    error,
    actions: {
      handleFilterChange,
      handlePageChange,
      handleExportCsv,
      handleExportPdf,
      refresh: fetchReport,
    },
  };
}