/**
 * Formata uma data YYYY-MM-DD para DD/MM/YYYY sem sofrer distorção de fuso horário.
 */
export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return '—';

  // Pega apenas a parte da data caso venha com timestamp (ex: "2026-10-15T00:00:00.000000Z")
  const dateOnly = dateString.split('T')[0];
  const [year, month, day] = dateOnly.split('-');

  if (!year || !month || !day) return dateString;

  return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
}