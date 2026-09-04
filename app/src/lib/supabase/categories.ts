import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { mapCategoryRow, type CatalogCategory } from '@/lib/supabase/mappers';
import type { Sport } from '@/types/product';
import { SupabaseApiError } from '@/lib/supabase/products';

export async function fetchCategories(sport?: Sport): Promise<CatalogCategory[]> {
  if (!isSupabaseConfigured) {
    throw new SupabaseApiError('Supabase is not configured');
  }

  let query = supabase.from('categories').select('*').order('sort_order', { ascending: true });

  if (sport) {
    query = query.eq('sport', sport);
  }

  const { data, error } = await query;

  if (error) {
    throw new SupabaseApiError(error.message, error.code);
  }

  return (data ?? []).map(mapCategoryRow);
}

export function subscribeToCategories(onChange: () => void) {
  if (!isSupabaseConfigured) return () => undefined;
  const channelName = `categories-realtime-${Math.random().toString(36).slice(2, 9)}`;
  const channel = supabase.channel(channelName);

  channel.on(
    'postgres_changes',
    { event: '*', schema: 'public', table: 'categories' },
    () => onChange(),
  );

  channel.subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
