import { Router } from 'express';
import { z } from 'zod';
import { supabase } from '../lib/supabase.js';

export const inquiriesRouter = Router();

const inquirySchema = z.object({
  name: z.string().trim().max(120).optional(),
  email: z.string().trim().email().max(254).optional(),
  message: z.string().trim().min(3).max(2000),
});

inquiriesRouter.post('/', async (req, res) => {
  const parsed = inquirySchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const { name, email, message } = parsed.data;

  const { data, error } = await supabase
    .from('stylist_inquiries')
    .insert({ name: name ?? null, email: email ?? null, message })
    .select('id')
    .single();

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  res.status(201).json({ id: data.id, message: 'Inquiry received' });
});
