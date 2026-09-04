import type { Request, Response, NextFunction } from 'express';

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const secret = process.env.ADMIN_SECRET;
  const header = req.headers['x-admin-secret'];

  if (!secret || header !== secret) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  next();
}
