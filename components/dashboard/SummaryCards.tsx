import { fmtRupiah } from '@/lib/format';

export function SummaryCards({ income, expense }: { income: number; expense: number }) {
  return (
    <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))' }}>
      <div className="bg-[#0f6b4f] text-white rounded-2xl px-5 py-[18px] flex flex-col gap-0.5">
        <div className="text-xs opacity-75 font-medium">Remaining this month</div>
        <div className="text-[28px] font-bold tracking-tight">{fmtRupiah(income - expense)}</div>
      </div>
      <div className="bg-white border border-[#e6e9e7] rounded-2xl px-5 py-[18px] flex flex-col gap-0.5">
        <div className="text-xs text-[#6b7671] font-medium">Income</div>
        <div className="text-[22px] font-semibold">{fmtRupiah(income)}</div>
      </div>
      <div className="bg-white border border-[#e6e9e7] rounded-2xl px-5 py-[18px] flex flex-col gap-0.5">
        <div className="text-xs text-[#6b7671] font-medium">Expenses</div>
        <div className="text-[22px] font-semibold">{fmtRupiah(expense)}</div>
      </div>
    </div>
  );
}
