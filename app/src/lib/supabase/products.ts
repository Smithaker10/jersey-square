import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { mapProductRow } from '@/lib/supabase/mappers';
import type { JerseyProduct, Sport } from '@/types/product';

export class SupabaseApiError extends Error {
  readonly code?: string;

  constructor(message: string, code?: string) {
    super(message);
    this.name = 'SupabaseApiError';
    this.code = code;
  }
}

function handleError(error: { message: string; code?: string }) {
  throw new SupabaseApiError(error.message, error.code);
}

export async function fetchAllProducts(): Promise<JerseyProduct[]> {
  if (!isSupabaseConfigured) {
    throw new SupabaseApiError('Supabase is not configured');
  }

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('is_visible', true)
    .order('sort_order', { ascending: true });

  if (error) handleError(error);
  return (data ?? []).map(mapProductRow);
}

export async function fetchProductsBySport(sport: Sport): Promise<JerseyProduct[]> {
  if (!isSupabaseConfigured) {
    throw new SupabaseApiError('Supabase is not configured');
  }

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('is_visible', true)
    .eq('sport', sport)
    .order('popular_score', { ascending: false });

  if (error) handleError(error);
  return (data ?? []).map(mapProductRow);
}

export async function fetchProductsByCategory(
  categoryId: string,
  sport?: Sport,
): Promise<JerseyProduct[]> {
  if (!isSupabaseConfigured) {
    throw new SupabaseApiError('Supabase is not configured');
  }

  let query = supabase.from('products').select('*').eq('category', categoryId);

  if (sport) {
    query = query.eq('sport', sport);
  }

  const { data, error } = await query.order('sort_order', { ascending: true });

  if (error) handleError(error);
  return (data ?? []).map(mapProductRow);
}

export async function fetchProductById(id: number): Promise<JerseyProduct | null> {
  if (!isSupabaseConfigured) {
    throw new SupabaseApiError('Supabase is not configured');
  }

  const { data, error } = await supabase.from('products').select('*').eq('id', id).maybeSingle();

  if (error) handleError(error);
  return data ? mapProductRow(data) : null;
}

export async function searchProductsSupabase(
  searchQuery: string,
  sport?: Sport | null,
): Promise<JerseyProduct[]> {
  if (!isSupabaseConfigured) {
    throw new SupabaseApiError('Supabase is not configured');
  }

  let trimmed = searchQuery.trim();
  if (!trimmed) return [];

  const lower = trimmed.toLowerCase();
  if (lower.includes('barca') || lower.includes('barcelona') || lower === 'fcb') {
    trimmed = 'Barcelona';
  } else if (lower === 'real' || lower.includes('real madrid')) {
    trimmed = 'Real Madrid';
  }

  const pattern = `%${trimmed}%`;

  let builder = supabase
    .from('products')
    .select('*')
    .or(
      `name.ilike.${pattern},team.ilike.${pattern},player.ilike.${pattern},sport.ilike.${pattern},category.ilike.${pattern},category_label.ilike.${pattern},description.ilike.${pattern}`,
    )
    .eq('is_visible', true)
    .order('popular_score', { ascending: false });

  if (sport) {
    builder = builder.eq('sport', sport);
  }

  const { data, error } = await builder;

  if (error) handleError(error);
  return (data ?? []).map(mapProductRow);
}

export function subscribeToProducts(onChange: () => void) {
  if (!isSupabaseConfigured) return () => undefined;

  const channelName = `products-realtime-${Math.random().toString(36).slice(2, 9)}`;
  const channel = supabase.channel(channelName);

  channel.on(
    'postgres_changes',
    { event: '*', schema: 'public', table: 'products' },
    () => onChange(),
  );

  channel.subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
