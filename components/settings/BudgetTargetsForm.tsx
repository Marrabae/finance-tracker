'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { updateBudgetTarget } from '@/actions/budgets';
import { setCategoryRecurring } from '@/actions/categories';
import { formatThousands, parseDigits } from '@/lib/format';

interface Row { categoryId: string; kategori: string; value: number; isRecurring: boolean }

function BudgetRow({ row }: { row: Row }) {
  const [, startTransition] = useTransition();
  const [value, setValue] = useState(String(row.value));
  const [isRecurring, setIsRecurring] = useState(row.isRecurring);

  function saveAmount() {
    if (Number(value) === row.value) return;
    startTransition(async () => {
      const result = await updateBudgetTarget(row.categoryId, Number(value));
      if (!result.ok) toast.error(result.message);
    });
  }

  function toggleRecurring() {
    const next = !isRecurring;
    setIsRecurring(next);
    startTransition(async () => {
      const result = await setCategoryRecurring(row.categoryId, next);
      if (!result.ok) { toast.error(result.message); setIsRecurring(!next); }
    });
  }

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 flex flex-col gap-1">
        <div className="text-[13px] font-medium">{row.kategori}</div>
        <label className="flex items-center gap-1.5 text-[11.5px] text-[#6b7671] cursor-pointer select-none">
          <input type="checkbox" checked={isRecurring} onChange={toggleRecurring} className="accent-[#0f6b4f]" />
          Recurring bill (fixed monthly)
        </label>
      </div>
      <div className="flex items-center gap-1.5 border border-[#e6e9e7] rounded-[9px] px-2.5 w-[150px]">
        <span className="text-xs text-[#6b7671] font-semibold">Rp</span>
        <input
          inputMode="numeric"
          value={formatThousands(value)}
          onChange={(e) => setValue(String(parseDigits(e.target.value)))}
          onBlur={saveAmount}
          className="border-none py-2 text-[13.5px] font-semibold w-full min-w-0 bg-transparent text-[#111814] text-right"
        />
      </div>
    </div>
  );
}

export function BudgetTargetsForm({ rows }: { rows: Row[] }) {
  return (
    <div className="bg-white border border-[#e6e9e7] rounded-2xl px-5 py-[18px] flex flex-col gap-3">
      <div>
        <div className="text-sm font-semibold">Monthly budget targets</div>
        <div className="text-[11.5px] text-[#6b7671] mt-0.5">
          Mark fixed obligations (loan payments, subscriptions, …) as recurring — the Dashboard groups
          them separately from discretionary spending.
        </div>
      </div>
      {rows.map((r) => <BudgetRow key={r.categoryId} row={r} />)}
    </div>
  );
}
