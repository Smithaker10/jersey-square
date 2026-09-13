export function ProductSkeleton() {
  return (
    <div className="flex h-full flex-col justify-between animate-pulse overflow-hidden rounded-lg bg-white border border-gray-200/80 sm:rounded-xl sm:border-gray-100">
      <div className="aspect-square bg-gray-200 sm:aspect-[3/4]" />
      <div className="space-y-2 p-2 sm:p-4">
        <div className="h-2.5 w-12 rounded bg-gray-200 sm:h-3 sm:w-16" />
        <div className="h-3.5 w-full rounded bg-gray-200 sm:h-4" />
        <div className="h-3 w-2/3 rounded bg-gray-200 sm:h-3.5" />
        <div className="h-4 w-20 rounded bg-gray-200 sm:h-5 sm:w-24" />
      </div>
      <div className="p-2 sm:hidden">
        <div className="h-7 w-full rounded-md bg-gray-200" />
      </div>
    </div>
  );
}
