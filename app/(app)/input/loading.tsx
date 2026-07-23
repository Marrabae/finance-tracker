import { SkeletonCard } from '@/components/ui/Skeleton';

export default function InputLoading() {
  return (
    <div className="max-w-[480px] w-full mx-auto">
      <SkeletonCard className="h-[560px]" />
    </div>
  );
}
