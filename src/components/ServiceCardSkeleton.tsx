import { Skeleton } from "@/components/ui/skeleton";

const ServiceCardSkeleton = () => {
  return (
    <div className="h-full p-6 border-2 border-border rounded-2xl min-h-[180px]">
      <div className="space-y-4">
        <Skeleton className="w-10 h-10 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>
        <div className="flex items-center justify-between pt-4 border-t">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
    </div>
  );
};

export default ServiceCardSkeleton;
