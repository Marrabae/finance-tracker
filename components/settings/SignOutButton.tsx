'use client';

import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export function SignOutButton() {
  const router = useRouter();

  async function onClick() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace('/login');
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="text-[13px] font-semibold text-[#c0361d] bg-[#fdf1ee] border-none rounded-[10px] px-4 py-2.5 cursor-pointer self-start"
    >
      Sign out
    </button>
  );
}
