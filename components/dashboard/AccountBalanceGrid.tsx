import { fmtRupiah } from '@/lib/format';

interface Row {
  name: string;
  balance: number;
  emphasized?: boolean;
}

export function AccountBalanceGrid({ rows }: { rows: Row[] }) {
  return (
    <div className="bg-white border border-[#e6e9e7] rounded-2xl px-5 py-4">
      <div className="flex justify-between items-baseline mb-3">
        <div className="text-sm font-semibold">Accounts</div>
        <div className="text-[11px] text-[#6b7671] font-medium">current balance</div>
      </div>
      <div className="grid gap-2.5" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))' }}>
        {rows.map((a) => (
          <div
            key={a.name}
            className="rounded-xl px-3.5 py-3 flex flex-col gap-0.5"
            style={{ background: a.emphasized ? '#e9f3ef' : '#f7f8f7', border: `1px solid ${a.emphasized ? '#cfe4db' : '#eef1ef'}` }}
          >
            <div className="text-[11.5px] font-semibold" style={{ color: a.emphasized ? '#0f6b4f' : '#6b7671' }}>{a.name}</div>
            <div className="text-base font-semibold">{fmtRupiah(a.balance)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
