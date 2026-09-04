export function ProductSkeleton() {
  return (
    <div className="animate-pulse overflow-hidden rounded-xl bg-white shadow-sm">
      <div className="aspect-[3/4] bg-gray-200" />
      <div className="space-y-2 p-4">
        <div className="h-3 w-16 rounded bg-gray-200" />
        <div className="h-4 w-full rounded bg-gray-200" />
        <div className="h-4 w-2/3 rounded bg-gray-200" />
        <div className="h-5 w-24 rounded bg-gray-200" />
      </div>
    </div>
  );
}
