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

app.get('/healthz', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/bank-mappings', bankMappingsRouter);

app.use(notFoundHandler);
app.use(errorHandler);

const pool = createPool();

app.locals.pool = pool;
app.locals.supportToken = supportToken;

app.listen(PORT, () => {
  console.log(`Backend listening on port ${PORT}`);
});
