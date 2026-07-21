'use client';

import { formatThousands, parseDigits } from '@/lib/format';

export function AmountInput({
  value,
  onChange,
  placeholder = '0',
  autoFocus = false,
}: {
  value: string;
  onChange: (digitsOnly: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
}) {
  return (
    <div className="flex items-center border border-[#e6e9e7] rounded-[10px] px-3 gap-2 bg-white">
      <span className="text-sm text-[#6b7671] font-semibold">Rp</span>
      <input
        inputMode="numeric"
        placeholder={placeholder}
        autoFocus={autoFocus}
        value={formatThousands(value)}
        onChange={(e) => onChange(String(parseDigits(e.target.value)))}
        className="border-none py-3 text-lg font-semibold flex-1 min-w-0 bg-transparent text-[#111814] focus:outline-none"
      />
    </div>
  );
}
