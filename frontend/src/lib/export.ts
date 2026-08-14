export interface ExportOptions {
  filename?: string;
  headers?: string[];
}

export class ExportService {
  /**
   * Exporta dados para CSV e inicia download
   */
  static exportToCSV(
    data: Array<Record<string, any>>,
    filename: string = 'export.csv',
    headers?: string[]
  ) {
    if (!data || data.length === 0) {
      alert('Nenhum dado para exportar');
      return;
    }

    // Definir headers
    const keys = headers || Object.keys(data[0]);

    // Criar CSV
    const csv = [
      keys.map((key) => `"${key}"`).join(','),
      ...data.map((row) =>
        keys
          .map((key) => {
            const value = row[key];
            const stringValue = String(value ?? '');
            return `"${stringValue.replace(/"/g, '""')}"`;
          })
          .join(',')
      ),
    ].join('\n');

    // Iniciar download
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  /**
   * Exporta dados para PDF usando uma biblioteca simples
   * Para uma solução mais robusta, considere usar jsPDF + autoTable
   */
  static async exportToPDF(
    data: Array<Record<string, any>>,
    filename: string = 'export.pdf',
    title?: string,
    headers?: string[]
  ) {
    if (!data || data.length === 0) {
      alert('Nenhum dado para exportar');
      return;
    }

    // Importar jsPDF dinamicamente
    const { jsPDF } = await import('jspdf');
    const autoTable = (await import('jspdf-autotable')).default;

    const doc = new jsPDF();
    const keys = headers || Object.keys(data[0]);

    // Adicionar título
    if (title) {
      doc.setFontSize(14);
      doc.text(title, 14, 10);
    }

    // Preparar dados para tabela
    const tableData = data.map((row) => keys.map((key) => row[key] ?? ''));

    // Adicionar tabela
    autoTable(doc, {
      head: [keys],
      body: tableData,
      startY: title ? 20 : 10,
      margin: { left: 10, right: 10 },
      styles: { fontSize: 10 },
      headStyles: { backgroundColor: [59, 130, 246], textColor: 255 },
      alternateRowStyles: { backgroundColor: [242, 242, 242] },
    });

    // Salvar
    doc.save(filename);
  }

  /**
   * Formata dados monetários para a exportação
   */
  static formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  }

  /**
   * Formata datas para DD/MM/YYYY
   */
  static formatDate(dateString: string | null | undefined): string {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('pt-BR');
  }
}
