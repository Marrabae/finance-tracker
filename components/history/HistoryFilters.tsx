'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import type { TransactionType } from '@/lib/types';

interface Option { value: string; label: string }

export function HistoryFilters({
  categoryOptions,
  accountOptions,
  count,
}: {
  categoryOptions: Option[];
  accountOptions: Option[];
  count: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function setParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (!value || value === 'all') params.delete(key);
    else params.set(key, value);
    router.push(`${pathname}?${params.toString()}`);
  }

  function clearAll() {
    router.push(pathname);
  }

  const hType = (searchParams.get('type') as TransactionType | null) ?? 'all';

  const fieldCls = 'border border-[#e6e9e7] rounded-[10px] px-2.5 py-2 text-[13px] bg-white text-[#111814]';

  return (
    <div className="bg-white border border-[#e6e9e7] rounded-2xl px-5 py-4 flex flex-wrap gap-2.5 items-center">
      <div style={{ minWidth: 220 }}>
        <SegmentedControl
          segments={[
            { value: 'all', label: 'All' },
            { value: 'expense', label: 'Expense' },
            { value: 'income', label: 'Income' },
            { value: 'transfer', label: 'Transfer' },
          ]}
          value={hType}
          onChange={(v) => setParam('type', v)}
          activeColor="#0f6b4f"
        />
      </div>

      <select className={fieldCls} value={searchParams.get('category') ?? 'all'} onChange={(e) => setParam('category', e.target.value)}>
        {categoryOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>

      <select className={fieldCls} value={searchParams.get('account') ?? 'all'} onChange={(e) => setParam('account', e.target.value)}>
        {accountOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>

      <input type="date" className={fieldCls} value={searchParams.get('from') ?? ''} onChange={(e) => setParam('from', e.target.value)} />
      <span className="text-xs text-[#6b7671]">to</span>
      <input type="date" className={fieldCls} value={searchParams.get('to') ?? ''} onChange={(e) => setParam('to', e.target.value)} />

      <button type="button" onClick={clearAll} className="text-xs text-[#6b7671] bg-transparent border-none cursor-pointer underline">
        Clear
      </button>

      <span className="text-xs text-[#6b7671] ml-auto">{count} transactions</span>
    </div>
  );
}
