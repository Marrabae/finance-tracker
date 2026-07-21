'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { createTransaction, updateTransaction, type TransactionInput } from '@/actions/transactions';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Chip } from '@/components/ui/Chip';
import { AmountInput } from '@/components/ui/AmountInput';
import { Button } from '@/components/ui/Button';
import { todayISODate } from '@/lib/format';
import type { TransactionType } from '@/lib/types';

interface Option { id: string; name: string }

export interface EditingTransaction {
  id: string;
  tanggal: string;
  tipe: TransactionType;
  categoryId: string | null;
  accountId: string;
  accountToId: string | null;
  jumlah: number;
  catatan: string;
}

export function TransactionForm({
  accounts,
  expenseCategories,
  incomeCategories,
  editing,
}: {
  accounts: Option[];
  expenseCategories: Option[];
  incomeCategories: Option[];
  editing: EditingTransaction | null;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [tipe, setTipe] = useState<TransactionType>(editing?.tipe ?? 'expense');
  const [tanggal, setTanggal] = useState(editing?.tanggal ?? todayISODate());
  const [categoryId, setCategoryId] = useState<string | null>(editing?.categoryId ?? null);
  const [accountId, setAccountId] = useState<string | null>(editing?.accountId ?? accounts[0]?.id ?? null);
  const [accountToId, setAccountToId] = useState<string | null>(editing?.accountToId ?? null);
  const [jumlah, setJumlah] = useState(editing ? String(editing.jumlah) : '');
  const [catatan, setCatatan] = useState(editing?.catatan ?? '');

  const isTrf = tipe === 'transfer';
  const categories = tipe === 'income' ? incomeCategories : expenseCategories;

  function resetForm() {
    setTipe('expense');
    setTanggal(todayISODate());
    setCategoryId(null);
    setAccountId(accounts[0]?.id ?? null);
    setAccountToId(null);
    setJumlah('');
    setCatatan('');
  }

  function onSubmit() {
    const input: TransactionInput = {
      tanggal,
      tipe,
      categoryId: isTrf ? null : categoryId,
      accountId: accountId ?? '',
      accountToId: isTrf ? accountToId : null,
      jumlah: Number(jumlah || 0),
      catatan,
    };

    startTransition(async () => {
      const result = editing
        ? await updateTransaction(editing.id, input)
        : await createTransaction(input);

      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
      if (editing) {
        router.push('/history');
      } else {
        resetForm();
        router.refresh();
      }
    });
  }

  const submitLabel = editing ? 'Save changes' : isTrf ? 'Transfer funds' : tipe === 'income' ? 'Add income' : 'Add expense';

  return (
    <div className="max-w-[480px] w-full mx-auto bg-white border border-[#e6e9e7] rounded-2xl p-5 flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <div className="text-[15px] font-semibold">{editing ? 'Edit transaction' : 'New transaction'}</div>
        {editing && (
          <button
            type="button"
            onClick={() => router.push('/input')}
            className="text-xs text-[#6b7671] bg-transparent border-none cursor-pointer underline"
          >
            Cancel edit
          </button>
        )}
      </div>

      <SegmentedControl
        segments={[
          { value: 'expense', label: 'Expense' },
          { value: 'income', label: 'Income' },
          { value: 'transfer', label: 'Transfer' },
        ]}
        value={tipe}
        onChange={(v) => { setTipe(v); setCategoryId(null); }}
        activeColor={tipe === 'income' ? '#0f6b4f' : '#111814'}
      />

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-[#6b7671]">Date</label>
        <input
          type="date"
          value={tanggal}
          onChange={(e) => setTanggal(e.target.value)}
          className="border border-[#e6e9e7] rounded-[10px] px-3 py-2.5 text-sm bg-white text-[#111814]"
        />
      </div>

      {!isTrf && (
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-[#6b7671]">Category</label>
          <div className="flex flex-wrap gap-1.5">
            {categories.map((c) => (
              <Chip key={c.id} label={c.name} selected={categoryId === c.id} onClick={() => setCategoryId(c.id)} />
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <label className="text-xs font-semibold text-[#6b7671]">{isTrf ? 'From account' : 'Account'}</label>
        <div className="flex flex-wrap gap-1.5">
          {accounts.map((a) => (
            <Chip key={a.id} label={a.name} selected={accountId === a.id} onClick={() => setAccountId(a.id)} />
          ))}
        </div>
      </div>

      {isTrf && (
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-[#6b7671]">To account</label>
          <div className="flex flex-wrap gap-1.5">
            {accounts.map((a) => (
              <Chip key={a.id} label={a.name} selected={accountToId === a.id} onClick={() => setAccountToId(a.id)} />
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-[#6b7671]">Amount</label>
        <AmountInput value={jumlah} onChange={setJumlah} />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-[#6b7671]">
          Note <span className="font-normal">(optional)</span>
        </label>
        <input
          placeholder="e.g. Catering week 2"
          value={catatan}
          onChange={(e) => setCatatan(e.target.value)}
          className="border border-[#e6e9e7] rounded-[10px] px-3 py-2.5 text-sm bg-white text-[#111814]"
        />
      </div>

      <Button type="button" disabled={isPending} onClick={onSubmit} className="py-3.5 text-[15px]">
        {isPending ? 'Saving…' : submitLabel}
      </Button>
    </div>
  );
}
