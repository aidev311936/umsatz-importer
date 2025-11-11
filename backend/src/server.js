import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import bankMappingsRouter from './routes/bankMappings.js';
import { notFoundHandler, errorHandler } from './utils/errorHandlers.js';
import { createPool } from './utils/db.js';

const PORT = process.env.PORT || 4000;
const supportToken = process.env.SUPPORT_TOKEN?.trim();

if (!supportToken) {
  console.error('SUPPORT_TOKEN environment variable must be configured.');
  process.exit(1);
}

const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN?.split(',') ?? true }));
app.use(express.json({ limit: '5mb' }));

async function healthCheckHandler(req, res) {
  const checks = {
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  };
  let statusCode = 200;

  const databaseConfigured =
    req.app?.locals?.databaseConfigured ?? Boolean(process.env.DATABASE_URL?.trim());
  const pool = req.app?.locals?.pool;

  if (databaseConfigured) {
    if (!pool) {
      statusCode = 503;
      checks.database = 'unavailable';
    } else {
      try {
        await pool.query('SELECT 1');
        checks.database = 'ok';
      } catch (error) {
        statusCode = 503;
        checks.database = 'error';
        console.error('Database health check failed', error);
      }
    }
  } else {
    checks.database = 'not_configured';
  }

  res.set('Cache-Control', 'no-store');
  res.status(statusCode).json({
    status: statusCode === 200 ? 'ok' : 'error',
    checks,
  });
}

app.get('/', healthCheckHandler);
app.get('/healthz', healthCheckHandler);

app.use('/api/bank-mappings', bankMappingsRouter);

app.use(notFoundHandler);
app.use(errorHandler);

const pool = createPool();

app.locals.pool = pool;
app.locals.databaseConfigured = Boolean(process.env.DATABASE_URL?.trim());
app.locals.supportToken = supportToken;

app.listen(PORT, () => {
  console.log(`Backend listening on port ${PORT}`);
});
