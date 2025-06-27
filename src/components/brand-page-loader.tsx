
import { Skeleton } from "@/components/ui/skeleton";

export default function BrandPageLoader() {
  return (
    <div className="p-4 md:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start gap-6">
        <Skeleton className="h-24 w-24 rounded-lg flex-shrink-0" />
        <div className="space-y-3 flex-grow">
          <Skeleton className="h-8 w-1/2" />
          <Skeleton className="h-5 w-1/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Products Section */}
        <div className="lg:col-span-2 space-y-4">
          <Skeleton className="h-8 w-1/3" />
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-square w-full rounded-xl" />
                <Skeleton className="h-5 w-5/6" />
                <Skeleton className="h-6 w-1/4" />
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar Section */}
        <aside className="space-y-4">
          <Skeleton className="h-8 w-1/2" />
          <div className="space-y-4">
             {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-32 w-full rounded-lg" />
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
