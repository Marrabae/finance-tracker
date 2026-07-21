'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { deleteTransaction } from '@/actions/transactions';

export function DeleteTxButton({ id }: { id: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function onClick() {
    if (!confirm('Delete this transaction?')) return;
    startTransition(async () => {
      const result = await deleteTransaction(id);
      if (!result.ok) { toast.error(result.message); return; }
      toast.success(result.message);
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isPending}
      className="text-[11.5px] font-semibold text-[#c0361d] bg-[#fdf1ee] border-none rounded-[7px] px-2.5 py-1.5 cursor-pointer disabled:opacity-60"
    >
      Del
    </button>
  );
}
