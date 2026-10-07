import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { config, isProd } from './config/index.js';
import { areasRouter } from './routes/areas.js';
import { groundwaterRouter } from './routes/groundwater.js';
import { rainfallRouter } from './routes/rainfall.js';
import { waterSourcesRouter } from './routes/waterSources.js';
import { waterQualityRouter } from './routes/waterQuality.js';
import { predictionsRouter } from './routes/predictions.js';
import { scenarioRouter } from './routes/scenario.js';
import { sourcesRouter } from './routes/sources.js';
import { adminRouter } from './routes/admin.js';
import { notFoundHandler, errorHandler } from './middleware/errorHandler.js';

export function createApp() {
  const app = express();

  app.disable('x-powered-by');
  app.use(helmet());
  app.use(cors({ origin: config.corsOrigin }));
  app.use(express.json({ limit: '100kb' }));
  app.use(morgan(isProd ? 'combined' : 'dev'));

  // Rate limiting protects the public read endpoints from being hammered.
  app.use('/api', rateLimit({
    windowMs: config.rateLimitWindowMs,
    max: config.rateLimitMax,
    standardHeaders: true,
    legacyHeaders: false,
  }));

  app.get('/health', (req, res) => res.json({ status: 'ok', env: config.nodeEnv }));

  app.use('/api/areas', areasRouter);
  app.use('/api/groundwater', groundwaterRouter);
  app.use('/api/rainfall', rainfallRouter);
  app.use('/api/water-sources', waterSourcesRouter);
  app.use('/api/water-quality', waterQualityRouter);
  app.use('/api/predictions', predictionsRouter);
  app.use('/api/scenario', scenarioRouter);
  app.use('/api/sources', sourcesRouter);
  app.use('/api/admin', adminRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
