import { fmtNumber } from '@/lib/format';
import { ProgressBar } from '@/components/ui/ProgressBar';
import type { BudgetRow } from '@/lib/derive';

function Row({ r }: { r: BudgetRow }) {
  return (
    <div
      className="rounded-xl px-[13px] py-[11px] flex flex-col gap-1.5"
      style={{ background: r.over ? '#fdf1ee' : '#fff', border: `1px solid ${r.over ? '#f0d5cd' : '#eef1ef'}` }}
    >
      <div className="flex justify-between items-center gap-2 text-[12.5px]">
        <span className="font-semibold flex gap-2 items-center">
          {r.kategori}
          {r.over && (
            <span className="text-[9px] font-bold tracking-wide bg-[#c0361d] text-white rounded px-1.5 py-0.5">OVER</span>
          )}
        </span>
        <span style={{ color: r.over ? '#c0361d' : '#6b7671', fontWeight: r.over ? 600 : 400 }}>
          {fmtNumber(r.actual)} / {fmtNumber(r.target)}
        </span>
      </div>
      <ProgressBar pct={r.pct} track={r.over ? '#f3d9d3' : '#eef1ef'} fill={r.over ? '#c0361d' : '#0f6b4f'} />
    </div>
  );
}

function Group({ label, rows }: { label: string; rows: BudgetRow[] }) {
  if (rows.length === 0) return null;
  return (
    <div className="flex flex-col gap-2.5">
      <div className="text-[11px] font-semibold text-[#6b7671] tracking-wide uppercase">{label}</div>
      <div className="grid gap-2.5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
        {rows.map((r) => <Row key={r.categoryId} r={r} />)}
      </div>
    </div>
  );
}

export function BudgetProgressList({ rows, monthHasTx }: { rows: BudgetRow[]; monthHasTx: boolean }) {
  const fixed = rows.filter((r) => r.isRecurring);
  const discretionary = rows.filter((r) => !r.isRecurring);

  return (
    <div className="bg-white border border-[#e6e9e7] rounded-2xl px-5 py-[18px] flex flex-col gap-4">
      <div className="flex justify-between items-baseline">
        <div className="text-sm font-semibold">Budgets</div>
        <div className="text-[11px] text-[#6b7671] font-medium">actual / target</div>
      </div>
      <Group label="Fixed bills" rows={fixed} />
      <Group label="Discretionary" rows={discretionary} />
      {!monthHasTx && (
        <div className="text-center text-[#6b7671] text-[13px] pt-2 pb-1">
          No transactions this month yet — add one from the Input tab.
        </div>
      )}
    </div>
  );
}
