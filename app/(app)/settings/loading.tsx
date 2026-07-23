import { SkeletonCard } from '@/components/ui/Skeleton';

export default function SettingsLoading() {
  return (
    <div className="max-w-[560px] w-full mx-auto flex flex-col gap-3.5">
      <SkeletonCard className="h-[160px]" />
      <SkeletonCard className="h-[160px]" />
      <SkeletonCard className="h-[140px]" />
    </div>
  );
}
