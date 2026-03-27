export function ArtistProfileSkeleton() {
  return (
    <div className="animate-pulse">
      {/* Banner skeleton */}
      <div className="h-48 bg-gradient-to-br from-gray-200 via-gray-300 to-gray-200"></div>

      {/* Content skeleton */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative -mt-16">
          <div className="flex items-end space-x-6">
            {/* Avatar skeleton */}
            <div className="w-32 h-32 rounded-full bg-gray-200 border-4 border-white flex-shrink-0"></div>

            {/* Name and actions skeleton */}
            <div className="flex-1 pb-2">
              <div className="flex items-center justify-between">
                <div className="h-8 bg-gray-200 rounded w-48"></div>
                <div className="h-10 bg-gray-200 rounded w-32"></div>
              </div>
            </div>
          </div>

          {/* Social links skeleton */}
          <div className="flex items-center space-x-4 mt-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="w-5 h-5 bg-gray-200 rounded"></div>
            ))}
          </div>

          {/* Genres skeleton */}
          <div className="flex flex-wrap gap-2 mt-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-6 bg-gray-200 rounded-full w-20"></div>
            ))}
          </div>

          {/* Live state skeleton */}
          <div className="mt-6">
            <div className="flex items-center space-x-3 bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="w-3 h-3 bg-gray-200 rounded-full"></div>
              <div className="h-4 bg-gray-200 rounded w-16"></div>
            </div>
          </div>

          {/* Bio skeleton */}
          <div className="mt-8">
            <div className="space-y-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-4 bg-gray-200 rounded w-full"></div>
              ))}
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
