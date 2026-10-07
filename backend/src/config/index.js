// Centralised config. Everything environment-specific goes through here so
// no other file reads process.env directly — makes it trivial to see the
// app's full external surface at a glance, and to override in tests.
import 'dotenv/config';

function required(name, fallback) {
  const v = process.env[name];
  if (v === undefined || v === '') return fallback;
  return v;
}

export const config = {
  port: Number(required('PORT', 4000)),
  nodeEnv: required('NODE_ENV', 'development'),
  dbPath: required('DB_PATH', './data/app.db'),
  adminApiKey: required('ADMIN_API_KEY', 'dev-only-change-me'),
  corsOrigin: required('CORS_ORIGIN', '*'),
  refreshCron: required('REFRESH_CRON', '0 3 * * *'), // default: 3am daily
  rateLimitWindowMs: Number(required('RATE_LIMIT_WINDOW_MS', 60_000)),
  rateLimitMax: Number(required('RATE_LIMIT_MAX', 120)),
};

export const isProd = config.nodeEnv === 'production';
