import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import bankMappingsRouter from './routes/bankMappings.js';
import { notFoundHandler, errorHandler } from './utils/errorHandlers.js';
import { createPool } from './utils/db.js';

const PORT = process.env.PORT || 4000;
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

app.listen(PORT, () => {
  console.log(`Backend listening on port ${PORT}`);
});
