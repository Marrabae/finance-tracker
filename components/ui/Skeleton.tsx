export function SkeletonBlock({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse bg-[#e6e9e7] rounded-xl ${className}`} />;
}

export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-white border border-[#e6e9e7] rounded-2xl p-5 flex flex-col gap-3 ${className}`}>
      <SkeletonBlock className="h-4 w-1/3" />
      <SkeletonBlock className="h-3 w-2/3" />
      <SkeletonBlock className="h-3 w-1/2" />
    </div>
  );
}
 