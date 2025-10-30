import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import pinoHttp from 'pino-http';
import { randomUUID } from 'node:crypto';
import { mappingsRouter } from './routes/mappings.routes.js';
import { aiRouter } from './routes/ai.routes.js';
import { errorHandler } from './middleware/errorHandler.js';
import { getEnv } from './utils/parseEnv.js';

const env = getEnv();
const app = express();

app.disable('x-powered-by');
app.set('trust proxy', 1);

app.use((req, _res, next) => {
  req.id = randomUUID();
  next();
});

app.use(
  pinoHttp({
    redact: ['req.headers.authorization'],
    genReqId: (req) => req.id
  })
);

app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
app.use(express.json({ limit: '5mb' }));
app.use(
  rateLimit({
    windowMs: 60 * 1000,
    max: 60,
    standardHeaders: true,
    legacyHeaders: false
  })
);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/mappings', mappingsRouter);
app.use('/api/ai', aiRouter);

app.use(errorHandler);

const port = env.PORT;

if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => {
    console.log(`Backend listening on port ${port}`);
  });
}

export default app;
