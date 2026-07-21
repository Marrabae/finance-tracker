'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { addCategory, removeCategory } from '@/actions/categories';
import { Button } from '@/components/ui/Button';
import type { CategoryKind } from '@/lib/types';

interface Option { id: string; name: string }

function Tag({ name, onRemove }: { name: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1.5 bg-[#f7f8f7] border border-[#e6e9e7] rounded-full pl-3 pr-1.5 py-1.5 text-[12.5px] font-medium">
      {name}
      <button
        type="button"
        onClick={onRemove}
        className="border-none bg-[#e6e9e7] text-[#6b7671] rounded-full w-[18px] h-[18px] text-[11px] leading-none cursor-pointer flex items-center justify-center"
      >
        ×
      </button>
    </span>
  );
}

function CategoryGroup({ label, kind, categories }: { label: string; kind: CategoryKind; categories: Option[] }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [value, setValue] = useState('');

  function submit() {
    const name = value.trim();
    if (!name) return;
    startTransition(async () => {
      const result = await addCategory(kind, name);
      if (!result.ok) { toast.error(result.message); return; }
      toast.success(result.message);
      setValue('');
      router.refresh();
    });
  }

  function remove(id: string) {
    startTransition(async () => {
      const result = await removeCategory(id);
      if (!result.ok) { toast.error(result.message); return; }
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="text-xs font-semibold text-[#6b7671]">{label}</div>
      <div className="flex flex-wrap gap-1.5">
        {categories.map((c) => <Tag key={c.id} name={c.name} onRemove={() => remove(c.id)} />)}
      </div>
      <div className="flex gap-2">
        <input
          placeholder={`New ${label.toLowerCase()} category`}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          className="flex-1 border border-[#e6e9e7] rounded-[10px] px-3 py-2 text-[13px] bg-white text-[#111814]"
        />
        <Button type="button" onClick={submit} className="px-4 py-2 text-[13px]">Add</Button>
      </div>
    </div>
  );
}

export function CategoryManager({ expenseCategories, incomeCategories }: { expenseCategories: Option[]; incomeCategories: Option[] }) {
  return (
    <div className="bg-white border border-[#e6e9e7] rounded-2xl px-5 py-[18px] flex flex-col gap-3.5">
      <div className="text-sm font-semibold">Categories</div>
      <CategoryGroup label="Expense" kind="expense" categories={expenseCategories} />
      <CategoryGroup label="Income" kind="income" categories={incomeCategories} />
    </div>
  );
}
