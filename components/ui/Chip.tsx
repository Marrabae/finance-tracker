export function Chip({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        'cursor-pointer rounded-full px-3 py-1.5 text-[12.5px] font-semibold border transition-colors ' +
        (selected
          ? 'bg-[#0f6b4f] text-white border-[#0f6b4f]'
          : 'bg-white text-[#374440] border-[#dfe4e1] hover:border-[#0f6b4f]')
      }
    >
      {label}
    </button>
  );
}
