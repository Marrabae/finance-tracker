import { redirect } from 'next/navigation';
import { getAuthedUser } from '@/lib/supabase/server';
import { TopNav } from '@/components/nav/TopNav';
import { BottomNav } from '@/components/nav/BottomNav';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getAuthedUser();
  if (!user) redirect('/login');

  return (
    <div className="min-h-screen bg-[#f7f8f7] text-[#111814]">
      <TopNav />
      <div className="max-w-[1040px] mx-auto px-5 pt-5 pb-[110px] md:pb-10 flex flex-col gap-4">
        {children}
      </div>
      <BottomNav />
    </div>
  );
}
