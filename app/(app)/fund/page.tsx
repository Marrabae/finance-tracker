import { createClient } from '@/lib/supabase/server';
import { fundProjection } from '@/lib/derive';
import { FundProgress } from '@/components/fund/FundProgress';
import type { FundBalance } from '@/lib/types';

export default async function FundPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const userId = user!.id;

  const { data } = await supabase.from('fund_balances').select('*').eq('user_id', userId).maybeSingle();
  const fund = data as FundBalance | null;

  const target = fund?.target_amount ?? 0;
  const currentBalance = fund?.current_balance ?? 0;
  const monthlyDeposit = fund?.monthly_deposit ?? 0;
  const depositedTotal = fund?.deposited_total ?? 0;

  const { pct, monthsLeft, etaLabel } = fundProjection(currentBalance, target, monthlyDeposit);

  return (
    <FundProgress
      pct={pct}
      currentBalance={currentBalance}
      target={target}
      depositedTotal={depositedTotal}
      monthlyDeposit={monthlyDeposit}
      monthsLeft={monthsLeft}
      etaLabel={etaLabel}
    />
  );
}
