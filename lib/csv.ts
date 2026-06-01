import Papa from 'papaparse';
import type { Customer, CSVCustomerRow } from '@/types';

export function exportCustomersToCSV(customers: Customer[]): void {
  const data = customers.map((c) => [
    c.name || '',
    c.phone || '',
    c.email || '',
    c.address || '',
    c.notes || '',
  ]);

  const csv = Papa.unparse({
    fields: ['name', 'phone', 'email', 'address', 'notes'],
    data,
  });

  const blob = new Blob(["\ufeff" + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `investo-customers-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export function parseCustomersCSV(
  file: File
): Promise<{ valid: CSVCustomerRow[]; errors: string[] }> {
  return new Promise((resolve) => {
    Papa.parse<CSVCustomerRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const errors: string[] = [];
        const valid: CSVCustomerRow[] = [];

        results.data.forEach((row, i) => {
          const lineNo = i + 2; // 1-indexed + header row
          if (!row.name?.trim()) {
            errors.push(`Row ${lineNo}: Missing name`);
            return;
          }
          if (!row.phone?.trim()) {
            errors.push(`Row ${lineNo}: Missing phone for "${row.name}"`);
            return;
          }
          valid.push({
            name: row.name.trim(),
            phone: row.phone.trim(),
            email: (row.email || '').trim(),
            address: (row.address || '').trim(),
            notes: (row.notes || '').trim(),
          });
        });

        resolve({ valid, errors });
      },
    });
  });
}

export function getCSVTemplate(): string {
  return 'name,phone,email,address,notes\nRajesh Kumar,9876543210,rajesh@example.com,"123 Main St, Mumbai","VIP client"';
}
