import { config } from '../config/index.js';

/**
 * Minimal API-key auth for admin/write endpoints (e.g. triggering a manual
 * data refresh). All GET /api/* read endpoints are intentionally public —
 * this is a public-interest civic dashboard, not a private data product.
 *
 * This is deliberately simple. For a real multi-user deployment, swap this
 * for a proper auth provider (Supabase Auth, Clerk, Auth0) and check a
 * verified session/JWT instead of a shared secret — see README "Auth".
 */
export function requireAdminKey(req, res, next) {
  const key = req.get('X-Api-Key');
  if (!key || key !== config.adminApiKey) {
    return res.status(401).json({ error: 'Missing or invalid X-Api-Key header.' });
  }
  next();
}
