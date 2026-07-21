'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { createAccount, updateAccount, deleteAccount } from '@/actions/accounts';
import { Button } from '@/components/ui/Button';
import { formatThousands, parseDigits } from '@/lib/format';

interface AccountRow { id: string; name: string; starting_balance: number }

function Row({ account }: { account: AccountRow }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [name, setName] = useState(account.name);
  const [balance, setBalance] = useState(String(account.starting_balance));

  function saveName() {
    if (name === account.name) return;
    startTransition(async () => {
      const result = await updateAccount(account.id, { name });
      if (!result.ok) { toast.error(result.message); return; }
      router.refresh();
    });
  }

  function saveBalance() {
    if (Number(balance) === account.starting_balance) return;
    startTransition(async () => {
      const result = await updateAccount(account.id, { starting_balance: Number(balance) });
      if (!result.ok) { toast.error(result.message); return; }
      router.refresh();
    });
  }

  function remove() {
    startTransition(async () => {
      const result = await deleteAccount(account.id);
      if (!result.ok) { toast.error(result.message); return; }
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-3">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        onBlur={saveName}
        className="flex-1 min-w-0 border border-[#e6e9e7] rounded-[9px] px-2.5 py-2 text-[13px] font-semibold bg-white text-[#111814]"
      />
      <div className="flex items-center gap-1.5 border border-[#e6e9e7] rounded-[9px] px-2.5 w-[150px] box-border">
        <span className="text-xs text-[#6b7671] font-semibold">Rp</span>
        <input
          inputMode="numeric"
          value={formatThousands(balance)}
          onChange={(e) => setBalance(String(parseDigits(e.target.value)))}
          onBlur={saveBalance}
          className="border-none py-2 text-[13px] font-semibold w-full min-w-0 bg-transparent text-[#111814] text-right"
        />
      </div>
      <button
        type="button"
        onClick={remove}
        className="border-none bg-[#fdf1ee] text-[#c0361d] rounded-lg w-[26px] h-[26px] text-[13px] cursor-pointer flex-none"
      >
        ×
      </button>
    </div>
  );
}

export function AccountManager({ accounts }: { accounts: AccountRow[] }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [newAcc, setNewAcc] = useState('');

  function submit() {
    const name = newAcc.trim();
    if (!name) return;
    startTransition(async () => {
      const result = await createAccount(name);
      if (!result.ok) { toast.error(result.message); return; }
      toast.success(result.message);
      setNewAcc('');
      router.refresh();
    });
  }

  return (
    <div className="bg-white border border-[#e6e9e7] rounded-2xl px-5 py-[18px] flex flex-col gap-2.5">
      <div className="text-sm font-semibold mb-0.5">Accounts</div>
      <div className="flex text-[11px] font-semibold text-[#6b7671] gap-3">
        <span className="flex-1">Name</span>
        <span className="w-[150px]">Starting balance</span>
        <span className="w-[26px]" />
      </div>
      {accounts.map((a) => <Row key={a.id} account={a} />)}
      <div className="flex gap-2">
        <input
          placeholder="New account (e.g. Jenius)"
          value={newAcc}
          onChange={(e) => setNewAcc(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          className="flex-1 border border-[#e6e9e7] rounded-[10px] px-3 py-2 text-[13px] bg-white text-[#111814]"
        />
        <Button type="button" onClick={submit} className="px-4 py-2 text-[13px]">Add</Button>
      </div>
    </div>
  );
}
