import type { PdfPageFormat } from '@/helpers/pdfExport';

export const PDF_PAGE_FORMAT_OPTIONS: { value: PdfPageFormat; label: string }[] = [
  { value: 'a4', label: 'A4' },
  { value: 'a3', label: 'A3' },
  { value: 'letter', label: 'Letter' },
  { value: 'legal', label: 'Legal' },
];
