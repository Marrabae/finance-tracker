import { SkeletonBlock, SkeletonCard } from '@/components/ui/Skeleton';

export default function HistoryLoading() {
  return (
    <>
      <SkeletonBlock className="h-10 w-full" />
      <SkeletonCard className="h-[80px]" />
      <SkeletonCard className="h-[80px]" />
      <SkeletonCard className="h-[80px]" />
    </>
  );
}
