import Link from 'next/link';
import { formatDateLabel } from '@/lib/format';
import { DeleteTxButton } from './DeleteTxButton';

export interface HistoryRow {
  id: string;
  kategori: string;
  sub: string;
  amountFmt: string;
  amtColor: string;
}

export interface HistoryGroup {
  date: string;
  items: HistoryRow[];
}

export function TransactionGroupList({ groups }: { groups: HistoryGroup[] }) {
  if (groups.length === 0) {
    return <div className="text-center text-[#6b7671] text-[13px] py-8">No transactions match these filters.</div>;
  }

  return (
    <>
      {groups.map((g) => (
        <div key={g.date} className="flex flex-col gap-1.5">
          <div className="text-[11.5px] font-semibold text-[#6b7671] tracking-wide uppercase px-1 pt-1">
            {formatDateLabel(g.date)}
          </div>
          <div className="bg-white border border-[#e6e9e7] rounded-[14px] overflow-hidden flex flex-col">
            {g.items.map((it) => (
              <div key={it.id} className="flex items-center gap-3 px-4 py-[11px] border-b border-[#f0f2f0] last:border-b-0">
                <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                  <div className="text-[13.5px] font-semibold">{it.kategori}</div>
                  <div className="text-xs text-[#6b7671] overflow-hidden text-ellipsis whitespace-nowrap">{it.sub}</div>
                </div>
                <div className="text-[13.5px] font-semibold whitespace-nowrap" style={{ color: it.amtColor }}>
                  {it.amountFmt}
                </div>
                <div className="flex gap-1.5">
                  <Link
                    href={`/input?edit=${it.id}`}
                    className="text-[11.5px] font-semibold text-[#0f6b4f] bg-[#e9f3ef] rounded-[7px] px-2.5 py-1.5"
                  >
                    Edit
                  </Link>
                  <DeleteTxButton id={it.id} />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </>
  );
}
