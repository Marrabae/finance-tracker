import { fmtRupiah } from '@/lib/format';
import { ProgressBar } from '@/components/ui/ProgressBar';

export function FundProgress({
  pct,
  currentBalance,
  target,
  depositedTotal,
  monthlyDeposit,
  monthsLeft,
  etaLabel,
}: {
  pct: number;
  currentBalance: number;
  target: number;
  depositedTotal: number;
  monthlyDeposit: number;
  monthsLeft: number;
  etaLabel: string;
}) {
  return (
    <div className="max-w-[560px] w-full mx-auto flex flex-col gap-3.5">
      <div className="bg-[#0f6b4f] text-white rounded-[18px] px-6 py-[26px] flex flex-col gap-3.5">
        <div className="text-[13px] font-semibold opacity-80">Emergency fund</div>
        <div className="flex items-baseline gap-2.5">
          <div className="text-[42px] font-bold tracking-tight">{pct}%</div>
          <div className="text-[13px] opacity-75">of target</div>
        </div>
        <ProgressBar pct={pct} track="rgba(255,255,255,.22)" fill="#fff" height={10} />
        <div className="text-sm">
          <b>{fmtRupiah(currentBalance)}</b>{' '}
          <span className="opacity-75">of {fmtRupiah(target)} (6× monthly expenses)</span>
        </div>
      </div>

      <div className="grid gap-2.5" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}>
        <StatCard label="Deposited via transactions" value={fmtRupiah(depositedTotal)} />
        <StatCard label="Monthly deposit" value={fmtRupiah(monthlyDeposit)} />
        <StatCard label="Months remaining" value={String(monthsLeft)} />
        <StatCard label="Projected finish" value={etaLabel} />
      </div>

      <div className="text-[12.5px] text-[#6b7671] leading-relaxed px-1">
        The balance is automatic: starting balance (set in Settings) plus every expense logged under the
        &quot;Dana Darurat&quot; category. Log your monthly deposit as a normal transaction and the progress updates itself.
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white border border-[#e6e9e7] rounded-[14px] px-4 py-3.5">
      <div className="text-[11.5px] text-[#6b7671] font-medium">{label}</div>
      <div className="text-[17px] font-semibold">{value}</div>
    </div>
  );
}
