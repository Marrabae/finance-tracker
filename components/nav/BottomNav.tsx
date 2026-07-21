'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NAV_TABS } from '@/lib/constants';

export function BottomNav() {
  const pathname = usePathname();

  return (
    <div
      className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-[#e6e9e7] flex justify-around px-1.5 z-30"
      style={{ paddingTop: 8, paddingBottom: 'calc(8px + env(safe-area-inset-bottom))' }}
    >
      {NAV_TABS.map((t) => {
        const active = pathname.startsWith(`/${t.id}`);
        return (
          <Link
            key={t.id}
            href={`/${t.id}`}
            className={
              'px-2 py-1.5 rounded-lg text-[11px] font-semibold transition-colors ' +
              (active ? 'text-[#0f6b4f] bg-[#e9f3ef]' : 'text-[#6b7671]')
            }
          >
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}
