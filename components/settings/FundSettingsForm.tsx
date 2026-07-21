'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { updateFundSettings } from '@/actions/fund';
import { formatThousands, parseDigits } from '@/lib/format';

interface Fund { target_amount: number; starting_balance: number; monthly_deposit: number }

const FIELDS: { key: keyof Fund; label: string }[] = [
  { key: 'target_amount', label: 'Target total' },
  { key: 'starting_balance', label: 'Starting balance' },
  { key: 'monthly_deposit', label: 'Monthly deposit' },
];

function FundRow({ label, fieldKey, initial }: { label: string; fieldKey: keyof Fund; initial: number }) {
  const [, startTransition] = useTransition();
  const [value, setValue] = useState(String(initial));

  function save() {
    if (Number(value) === initial) return;
    startTransition(async () => {
      const result = await updateFundSettings({ [fieldKey]: Number(value) });
      if (!result.ok) toast.error(result.message);
    });
  }

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 text-[13px] font-medium">{label}</div>
      <div className="flex items-center gap-1.5 border border-[#e6e9e7] rounded-[9px] px-2.5 w-[150px]">
        <span className="text-xs text-[#6b7671] font-semibold">Rp</span>
        <input
          inputMode="numeric"
          value={formatThousands(value)}
          onChange={(e) => setValue(String(parseDigits(e.target.value)))}
          onBlur={save}
          className="border-none py-2 text-[13.5px] font-semibold w-full min-w-0 bg-transparent text-[#111814] text-right"
        />
      </div>
    </div>
  );
}

export function FundSettingsForm({ fund }: { fund: Fund }) {
  return (
    <div className="bg-white border border-[#e6e9e7] rounded-2xl px-5 py-[18px] flex flex-col gap-2.5">
      <div className="text-sm font-semibold mb-1">Emergency fund</div>
      {FIELDS.map((f) => <FundRow key={f.key} label={f.label} fieldKey={f.key} initial={fund[f.key]} />)}
    </div>
  );
}
