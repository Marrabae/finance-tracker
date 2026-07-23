'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { createApiToken, revokeApiToken } from '@/actions/api-tokens';
import { Button } from '@/components/ui/Button';

interface TokenRow {
  id: string;
  name: string;
  token_prefix: string;
  created_at: string;
  last_used_at: string | null;
}

function lastUsedLabel(iso: string | null): string {
  if (!iso) return 'never used';
  const minutes = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (minutes < 1) return 'used just now';
  if (minutes < 60) return `used ${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `used ${hours}h ago`;
  return `used ${Math.floor(hours / 24)}d ago`;
}

/** Shown once, right after creation — the plaintext token is unrecoverable after this. */
function NewTokenPanel({ token, onDismiss }: { token: string; onDismiss: () => void }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(token);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Copy failed — select the token and copy it manually');
    }
  }

  return (
    <div className="bg-[#eef7f2] border border-[#0f6b4f]/25 rounded-xl px-3.5 py-3 flex flex-col gap-2">
      <div className="text-xs font-semibold text-[#0f6b4f]">
        Copy this now — it won&apos;t be shown again
      </div>
      <div className="flex gap-2 items-center">
        <code className="flex-1 min-w-0 break-all text-[11px] bg-white border border-[#e6e9e7] rounded-lg px-2.5 py-2 text-[#111814]">
          {token}
        </code>
        <Button type="button" onClick={copy} className="px-3 py-2 text-xs flex-none">
          {copied ? 'Copied' : 'Copy'}
        </Button>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        className="self-start border-none bg-transparent text-[11px] text-[#6b7671] cursor-pointer p-0"
      >
        Done
      </button>
    </div>
  );
}

export function ApiTokenManager({ tokens }: { tokens: TokenRow[] }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [newName, setNewName] = useState('');
  const [freshToken, setFreshToken] = useState<string | null>(null);
  const [removedIds, setRemovedIds] = useState<Set<string>>(new Set());

  const visible = tokens.filter((t) => !removedIds.has(t.id));

  function revoke(id: string) {
    setRemovedIds((prev) => new Set(prev).add(id));
    startTransition(async () => {
      const result = await revokeApiToken(id);
      if (!result.ok) {
        toast.error(result.message);
        setRemovedIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
        return;
      }
      router.refresh();
    });
  }

  function submit() {
    const name = newName.trim();
    if (!name) return;
    startTransition(async () => {
      const result = await createApiToken(name);
      if (!result.ok || !result.token) {
        toast.error(result.message);
        return;
      }
      setFreshToken(result.token);
      setNewName('');
      router.refresh();
    });
  }

  return (
    <div className="bg-white border border-[#e6e9e7] rounded-2xl px-5 py-[18px] flex flex-col gap-2.5">
      <div className="text-sm font-semibold mb-0.5">API tokens</div>
      <div className="text-xs text-[#6b7671] -mt-1.5">
        For iOS Shortcuts and scripts. Send as <code>Authorization: Bearer …</code>
      </div>

      {visible.map((t) => (
        <div key={t.id} className="flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-semibold truncate text-[#111814]">{t.name}</div>
            <div className="text-[11px] text-[#6b7671]">
              {t.token_prefix}… · {lastUsedLabel(t.last_used_at)}
            </div>
          </div>
          <button
            type="button"
            onClick={() => revoke(t.id)}
            className="border-none bg-[#fdf1ee] text-[#c0361d] rounded-lg w-[26px] h-[26px] text-[13px] cursor-pointer flex-none"
          >
            ×
          </button>
        </div>
      ))}

      {freshToken && <NewTokenPanel token={freshToken} onDismiss={() => setFreshToken(null)} />}

      <div className="flex gap-2">
        <input
          placeholder="New token (e.g. iPhone Shortcuts)"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          className="flex-1 border border-[#e6e9e7] rounded-[10px] px-3 py-2 text-[13px] bg-white text-[#111814]"
        />
        <Button type="button" onClick={submit} className="px-4 py-2 text-[13px]">
          Create
        </Button>
      </div>
    </div>
  );
}
