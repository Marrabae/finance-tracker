export function ProgressBar({
  pct,
  track = '#eef1ef',
  fill = '#0f6b4f',
  height = 6,
}: {
  pct: number;
  track?: string;
  fill?: string;
  height?: number;
}) {
  return (
    <div style={{ height, borderRadius: height / 2, background: track }}>
      <div style={{ width: `${Math.min(100, Math.max(0, pct))}%`, height: '100%', borderRadius: height / 2, background: fill }} />
    </div>
  );
}
