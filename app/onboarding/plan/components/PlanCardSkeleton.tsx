export function PlanCardSkeleton() {
  return (
    <div className="relative flex flex-col h-full overflow-hidden animate-pulse">
      {/* Header area */}
      <div className="relative flex flex-col p-4 h-full">
        {/* Plan name and price skeleton */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1">
            <div className="h-5 bg-gray-200 rounded w-16"></div>
            <div className="h-4 bg-gray-200 rounded w-20"></div>
          </div>
          <div className="flex items-baseline gap-0.5">
            <div className="h-8 bg-gray-200 rounded w-20"></div>
            <div className="h-4 bg-gray-200 rounded w-16"></div>
          </div>
        </div>

        {/* Get started button skeleton */}
        <div className="w-full h-8 bg-gray-200 rounded-md mb-4"></div>

        {/* Features list skeleton */}
        <div className="flex-grow space-y-3">
          {/* "Everything in X, plus:" text */}
          <div className="h-4 bg-gray-200 rounded w-32"></div>

          {/* Feature items */}
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="flex items-center gap-2 py-1">
              <div className="h-3.5 w-3.5 bg-gray-200 rounded-full flex-shrink-0"></div>
              <div className="h-3 bg-gray-200 rounded flex-grow"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}