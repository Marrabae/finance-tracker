'use client';

import { useTransition } from 'react';
import { toast } from 'sonner';
import { deleteTransaction } from '@/actions/transactions';

export function DeleteTxButton({
  id,
  onOptimisticRemove,
  onFailure,
}: {
  id: string;
  onOptimisticRemove: () => void;
  onFailure: () => void;
}) {
  const [isPending, startTransition] = useTransition();

  function onClick() {
    if (!confirm('Delete this transaction?')) return;
    onOptimisticRemove();
    startTransition(async () => {
      const result = await deleteTransaction(id);
      if (!result.ok) {
        onFailure();
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
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
