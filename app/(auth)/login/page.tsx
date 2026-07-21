'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError('Email or password is incorrect.');
      return;
    }
    router.replace('/dashboard');
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f7f8f7] p-5">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-[380px] bg-white border border-[#e6e9e7] rounded-2xl p-6 flex flex-col gap-4"
      >
        <div className="flex items-center gap-2 mb-1">
          <div className="w-2.5 h-2.5 rounded-[3px] bg-[#0f6b4f]" />
          <div className="text-[15px] font-bold tracking-tight">Finance Tracker</div>
        </div>
        <div className="text-[13px] text-[#6b7671]">Sign in to continue</div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-[#6b7671]">Email</label>
          <input
            type="email"
            required
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border border-[#e6e9e7] rounded-[10px] px-3 py-2.5 text-sm bg-white text-[#111814] focus:outline-2 focus:outline-[#0f6b4f] focus:-outline-offset-1"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-[#6b7671]">Password</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border border-[#e6e9e7] rounded-[10px] px-3 py-2.5 text-sm bg-white text-[#111814] focus:outline-2 focus:outline-[#0f6b4f] focus:-outline-offset-1"
          />
        </div>

        {error && <div className="text-[13px] text-[#c0361d]">{error}</div>}

        <button
          type="submit"
          disabled={loading}
          className="bg-[#0f6b4f] text-white rounded-xl py-3.5 text-[15px] font-semibold cursor-pointer disabled:opacity-60 hover:bg-[#0c5940] transition-colors"
        >
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}
