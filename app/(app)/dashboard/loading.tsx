import { SkeletonBlock, SkeletonCard } from '@/components/ui/Skeleton';

export default function DashboardLoading() {
  return (
    <>
      <div className="flex items-center justify-between">
        <SkeletonBlock className="h-[34px] w-[34px] rounded-[10px]" />
        <SkeletonBlock className="h-4 w-32" />
        <SkeletonBlock className="h-[34px] w-[34px] rounded-[10px]" />
      </div>
      <SkeletonCard className="h-[110px]" />
      <SkeletonCard className="h-[140px]" />
      <SkeletonCard className="h-[200px]" />
    </>
  );
}
