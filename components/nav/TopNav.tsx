'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NAV_TABS } from '@/lib/constants';

export function TopNav() {
  const pathname = usePathname();

  return (
    <div className="bg-white border-b border-[#e6e9e7] sticky top-0 z-20">
      <div className="max-w-[1040px] mx-auto px-5 h-14 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-[3px] bg-[#0f6b4f]" />
          <div className="text-[15px] font-bold tracking-tight">Finance Tracker</div>
        </div>
        <nav className="hidden md:flex gap-1">
          {NAV_TABS.map((t) => {
            const active = pathname.startsWith(`/${t.id}`);
            return (
              <Link
                key={t.id}
                href={`/${t.id}`}
                className={
                  'rounded-[9px] px-3.5 py-2 text-[13px] font-semibold transition-colors ' +
                  (active ? 'bg-[#e9f3ef] text-[#0f6b4f]' : 'text-[#6b7671] hover:bg-[#f7f8f7]')
                }
              >
                {t.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
