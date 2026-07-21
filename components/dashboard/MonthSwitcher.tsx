import Link from 'next/link';
import { formatMonthLabel } from '@/lib/format';

export function MonthSwitcher({ year, month0 }: { year: number; month0: number }) {
  let prevY = year, prevM = month0 - 1;
  if (prevM < 0) { prevM = 11; prevY -= 1; }
  let nextY = year, nextM = month0 + 1;
  if (nextM > 11) { nextM = 0; nextY += 1; }

  const navBtn = 'w-[34px] h-[34px] flex items-center justify-center rounded-[10px] border border-[#e6e9e7] bg-white text-base text-[#6b7671] hover:border-[#0f6b4f] hover:text-[#0f6b4f] transition-colors';

  return (
    <div className="flex items-center justify-between">
      <Link href={`/dashboard?year=${prevY}&month=${prevM}`} className={navBtn}>&lsaquo;</Link>
      <div className="text-[15px] font-semibold">{formatMonthLabel(year, month0)}</div>
      <Link href={`/dashboard?year=${nextY}&month=${nextM}`} className={navBtn}>&rsaquo;</Link>
    </div>
  );
}
