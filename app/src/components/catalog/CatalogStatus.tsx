import { AlertCircle, Loader2 } from 'lucide-react';

interface CatalogStatusProps {
  loading?: boolean;
  error?: string | null;
}

export function CatalogStatus({ loading, error }: CatalogStatusProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-8 text-sm text-gray-500">
        <Loader2 size={18} className="animate-spin" />
        Loading catalog…
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-4 mb-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 sm:mx-6">
        <AlertCircle size={18} className="mt-0.5 shrink-0" />
        <span>{error}</span>
      </div>
    );
  }

  return null;
}
