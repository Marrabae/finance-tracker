export function fmtRupiah(n: number | null | undefined): string {
  return 'Rp' + Number(n || 0).toLocaleString('id-ID');
}

export function fmtNumber(n: number | null | undefined): string {
  return Number(n || 0).toLocaleString('id-ID');
}

/** Strip everything but digits — used while parsing a live-formatted amount input. */
export function parseDigits(value: string): number {
  return Number(value.replace(/\D/g, '') || 0);
}

/** Format a raw digit string for display in an amount input as-you-type. */
export function formatThousands(digitsOnly: string): string {
  if (!digitsOnly) return '';
  return Number(digitsOnly).toLocaleString('id-ID');
}

export function todayISODate(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function formatDateLabel(isoDate: string): string {
  return new Date(isoDate + 'T12:00:00').toLocaleDateString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  });
}

export function formatMonthLabel(year: number, month0: number): string {
  return new Date(year, month0, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}
