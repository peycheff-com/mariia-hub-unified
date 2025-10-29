import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

const BlogPostSkeleton = () => {
  return (
    <Card className="h-full overflow-hidden">
      <Skeleton className="h-48 w-full rounded-none" />
      <CardHeader>
        <div className="flex items-center gap-2 mb-3">
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
        <Skeleton className="h-7 w-full mb-2" />
        <Skeleton className="h-7 w-3/4" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-2/3 mb-4" />
        <div className="flex items-center gap-4 pt-4 border-t">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-20" />
        </div>
      </CardContent>
    </Card>
  );
};

export default BlogPostSkeleton;
