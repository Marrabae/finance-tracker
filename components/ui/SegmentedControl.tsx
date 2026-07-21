export interface Segment<T extends string> {
  value: T;
  label: string;
}

export function SegmentedControl<T extends string>({
  segments,
  value,
  onChange,
  activeColor = '#111814',
}: {
  segments: Segment<T>[];
  value: T;
  onChange: (v: T) => void;
  activeColor?: string;
}) {
  return (
    <div className="grid gap-1.5 bg-[#eef1ef] rounded-xl p-1" style={{ gridTemplateColumns: `repeat(${segments.length}, 1fr)` }}>
      {segments.map((s) => {
        const active = s.value === value;
        return (
          <button
            key={s.value}
            type="button"
            onClick={() => onChange(s.value)}
            className="border-none cursor-pointer rounded-lg py-2.5 text-[13.5px] font-semibold transition-colors"
            style={active ? { background: '#fff', color: activeColor, boxShadow: '0 1px 2px rgba(0,0,0,.08)' } : { background: 'transparent', color: '#6b7671' }}
          >
            {s.label}
          </button>
        );
      })}
    </div>
  );
}
