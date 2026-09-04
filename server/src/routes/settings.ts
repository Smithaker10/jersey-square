import { Router } from 'express';
import { supabase } from '../lib/supabase.js';
import type { SiteSettings } from '../types.js';

export const settingsRouter = Router();

settingsRouter.get('/', async (_req, res) => {
  const { data, error } = await supabase
    .from('site_settings')
    .select('*')
    .eq('id', 1)
    .maybeSingle();

  if (error || !data) {
    res.json({
      brandName: 'JerseySquare',
      tagline: 'Premium Apparel.',
      email: 'contact@jerseysquare.com',
      phone: '+91 9313486084',
      instagramUrl: 'https://www.instagram.com/jerseysquare',
      instagramHandle: '@jerseysquare',
      whatsappUrl: 'https://wa.me/919313486084',
      whatsappGroupUrl: 'https://chat.whatsapp.com/FZT1EuxY0FN9NbXIoIu3ax',
    });
    return;
  }

  const settings: SiteSettings = {
    brandName: data.brand_name ?? 'JerseySquare',
    tagline: data.tagline ?? '',
    email: data.email ?? 'contact@jerseysquare.com',
    phone: data.phone ?? '+91 9313486084',
    instagramUrl: data.instagram_url ?? 'https://www.instagram.com/jerseysquare',
    instagramHandle: data.instagram_handle ?? '@jerseysquare',
    whatsappUrl: data.whatsapp_url ?? 'https://wa.me/919313486084',
    whatsappGroupUrl: data.whatsapp_group_url ?? 'https://chat.whatsapp.com/FZT1EuxY0FN9NbXIoIu3ax',
  };

  res.json(settings);
});
