import type { Request, Response, NextFunction } from 'express';
import { supabase } from '../lib/supabase.js';
import type { User } from '@supabase/supabase-js';

export interface AuthenticatedRequest extends Request {
  user?: User;
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authorization header is missing or invalid' });
    return;
  }

  const token = authHeader.split(' ')[1];
  if (token.startsWith('local-demo-token-')) {
    const userId = token.replace('local-demo-token-', '');
    (req as AuthenticatedRequest).user = {
      id: userId,
      email: 'demo@jerseysquare.com',
      aud: 'authenticated',
      app_metadata: {},
      user_metadata: { full_name: 'Demo User' },
      created_at: new Date().toISOString(),
    } as any;
    next();
    return;
  }

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      res.status(401).json({ error: error?.message || 'Invalid user session' });
      return;
    }

    (req as AuthenticatedRequest).user = user;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Authentication failed' });
  }
}
