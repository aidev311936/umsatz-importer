import http, { IncomingMessage, ServerResponse } from 'http';
import { URL } from 'url';
import { createRouter } from './routes.js';
import { createAiClient } from './ai.js';
import { getPool, shutdownPool } from './db.js';
import { PostgresMappingsRepository } from './mappingsRepo.js';
import { RequestContext, RouteResponse } from './types.js';

const pool = getPool();
const repository = new PostgresMappingsRepository(pool);
const aiClient = createAiClient();
const router = createRouter(repository, aiClient);
const defaultHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

const server = http.createServer(async (req, res) => {
  if (!req.method || !req.url) {
    sendResponse(res, { status: 400, body: { error: 'Invalid request' } });
    return;
  }

  if (req.method === 'OPTIONS') {
    sendResponse(res, { status: 204 });
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host ?? 'localhost'}`);
  const match = router.match(req.method, url.pathname);

  if (!match) {
    sendResponse(res, { status: 404, body: { error: 'Not found' } });
    return;
  }

  try {
    const body = await maybeParseJson(req);
    const context: RequestContext = {
      req,
      method: req.method,
      url,
      params: match.params,
      query: url.searchParams,
      body,
      repo: repository,
      ai: aiClient,
    };

    const result = (await match.handler(context)) ?? { status: 204 };
    sendResponse(res, result);
  } catch (error) {
    handleError(res, error);
  }
});

const port = Number(process.env.PORT ?? 3001);

async function bootstrap() {
  try {
    await repository.ensureSchema();
  } catch (error) {
    console.error('Failed to ensure database schema', error);
    process.exitCode = 1;
    return;
  }

  server.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });
}

bootstrap().catch((error) => {
  console.error('Failed to start server', error);
  process.exitCode = 1;
});

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, () => {
    server.close(() => {
      shutdownPool()
        .catch((error) => console.error('Failed to shutdown database pool', error))
        .finally(() => process.exit(0));
    });
  });
}

async function maybeParseJson(req: IncomingMessage): Promise<unknown> {
  const method = req.method?.toUpperCase() ?? '';
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    await drainRequest(req);
    return null;
  }
  const contentLength = Number(req.headers['content-length'] ?? 0);
  if (contentLength === 0) {
    await drainRequest(req);
    return null;
  }
  const raw = await readRequestBody(req);
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw);
  } catch (error) {
    const err = new Error('Invalid JSON payload');
    (err as Error & { status?: number }).status = 400;
    throw err;
  }
}

function sendResponse(res: ServerResponse, response: RouteResponse): void {
  const status = response.status ?? (response.body === undefined ? 204 : 200);
  const headers: Record<string, string> = {
    ...defaultHeaders,
    ...(response.headers ?? {}),
  };
  const hasBody = status !== 204 && response.body !== undefined;
  if (hasBody) {
    headers['Content-Type'] = headers['Content-Type'] ?? 'application/json';
  }

  res.writeHead(status, headers);
  if (!hasBody) {
    res.end();
    return;
  }
  res.end(JSON.stringify(response.body));
}

function handleError(res: ServerResponse, error: unknown): void {
  const status = typeof (error as { status?: number }).status === 'number' ? (error as { status: number }).status : 500;
  const message = status === 400 ? (error as Error).message : 'Internal Server Error';
  if (status >= 500) {
    console.error(error);
  }
  sendResponse(res, {
    status,
    body: { error: message },
  });
}

function readRequestBody(req: IncomingMessage, limit = 1_000_000): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let total = 0;
    req.on('data', (chunk) => {
      const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      total += buffer.length;
      if (total > limit) {
        reject(createRequestEntityTooLargeError());
        req.destroy();
        return;
      }
      chunks.push(buffer);
    });
    req.on('end', () => {
      resolve(Buffer.concat(chunks).toString('utf8'));
    });
    req.on('error', (error) => reject(error));
  });
}

function drainRequest(req: IncomingMessage): Promise<void> {
  if (req.readableEnded || req.complete) {
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    const finish = () => resolve();
    req.on('end', finish);
    req.on('error', finish);
    req.on('close', finish);
    req.resume();
  });
}

function createRequestEntityTooLargeError(): Error {
  const error = new Error('Payload too large');
  (error as Error & { status?: number }).status = 413;
  return error;
}
