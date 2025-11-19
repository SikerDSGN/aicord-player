import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export function SongSkeleton() {
  return (
    <Card className="border-border bg-card hover-scale transition-smooth">
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <Skeleton className="h-16 w-16 rounded-lg flex-shrink-0" />
          <div className="flex-1 min-w-0 space-y-2">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
          <Skeleton className="h-10 w-10 rounded-full" />
        </div>
      </CardContent>
    </Card>
  );
}

export function PlaylistSkeleton() {
  return (
    <Card className="border-border bg-card hover-scale transition-smooth">
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <Skeleton className="h-20 w-20 rounded-lg flex-shrink-0" />
          <div className="flex-1 min-w-0 space-y-2">
            <Skeleton className="h-6 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-3 w-1/3" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function LoadingGrid({ count = 6, type = "song" }: { count?: number; type?: "song" | "playlist" }) {
  const SkeletonComponent = type === "song" ? SongSkeleton : PlaylistSkeleton;
  
  return (
    <div className="grid gap-3 md:gap-4 animate-fade-in">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonComponent key={i} />
      ))}
    </div>
  );
}
