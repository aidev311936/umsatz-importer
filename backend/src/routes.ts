import {
  AiCompletionClient,
  CreateMappingInput,
  MappingsRepository,
  RequestContext,
  RouteHandler,
  RouteMatch,
  Router,
  RouteResponse,
  UpdateMappingInput,
} from './types.js';

interface CompiledRoute {
  method: string;
  pattern: RegExp;
  keys: string[];
  handler: RouteHandler;
}

export function createRouter(repo: MappingsRepository, ai: AiCompletionClient): Router {
  const compiled = buildRoutes(repo, ai);
  return {
    match(method: string, pathname: string): RouteMatch | null {
      const upperMethod = method.toUpperCase();
      for (const route of compiled) {
        if (route.method !== upperMethod) continue;
        const match = route.pattern.exec(pathname);
        if (!match) continue;
        const params: Record<string, string> = {};
        route.keys.forEach((key, index) => {
          params[key] = decodeURIComponent(match[index + 1] ?? '');
        });
        return { handler: route.handler, params };
      }
      return null;
    },
  };
}

function buildRoutes(repo: MappingsRepository, ai: AiCompletionClient): CompiledRoute[] {
  const routes: Array<{ method: string; path: string; handler: RouteHandler }> = [
    {
      method: 'GET',
      path: '/health',
      handler: () => ({ status: 200, body: { status: 'ok' } }),
    },
    {
      method: 'GET',
      path: '/mappings',
      handler: async () => {
        const records = await repo.list();
        return { status: 200, body: records } satisfies RouteResponse;
      },
    },
    {
      method: 'GET',
      path: '/mappings/:id',
      handler: async (ctx: RequestContext) => {
        const id = ctx.params.id;
        if (!isValidUuid(id)) {
          return { status: 400, body: { error: 'Invalid mapping id' } };
        }
        const record = await repo.get(id);
        if (!record) {
          return { status: 404, body: { error: 'Mapping not found' } };
        }
        return { status: 200, body: record };
      },
    },
    {
      method: 'POST',
      path: '/mappings',
      handler: async (ctx) => {
        const payload = parseCreateMapping(ctx.body);
        const record = await repo.create(payload);
        return { status: 201, body: record };
      },
    },
    {
      method: 'PUT',
      path: '/mappings/:id',
      handler: async (ctx) => {
        const id = ctx.params.id;
        if (!isValidUuid(id)) {
          return { status: 400, body: { error: 'Invalid mapping id' } };
        }
        const payload = parseUpdateMapping(ctx.body);
        const record = await repo.update(id, payload);
        if (!record) {
          return { status: 404, body: { error: 'Mapping not found' } };
        }
        return { status: 200, body: record };
      },
    },
    {
      method: 'DELETE',
      path: '/mappings/:id',
      handler: async (ctx) => {
        const id = ctx.params.id;
        if (!isValidUuid(id)) {
          return { status: 400, body: { error: 'Invalid mapping id' } };
        }
        const deleted = await repo.remove(id);
        if (!deleted) {
          return { status: 404, body: { error: 'Mapping not found' } };
        }
        return { status: 204 };
      },
    },
    {
      method: 'POST',
      path: '/ai/suggestions',
      handler: async (ctx) => {
        if (!ai.isEnabled) {
          return {
            status: 503,
            body: { error: 'AI integration is disabled' },
          };
        }
        const body = ctx.body as Record<string, unknown> | null;
        if (!body || typeof body.prompt !== 'string' || !body.prompt.trim()) {
          return { status: 400, body: { error: 'prompt is required' } };
        }
        const result = await ai.createCompletion({
          prompt: body.prompt,
          systemInstructions:
            typeof body.systemInstructions === 'string' ? body.systemInstructions : undefined,
          temperature: typeof body.temperature === 'number' ? body.temperature : undefined,
          maxTokens: typeof body.maxTokens === 'number' ? body.maxTokens : undefined,
        });
        return { status: 200, body: result };
      },
    },
  ];

  return routes.map((route) => compileRoute(route.method, route.path, route.handler));
}

function compileRoute(method: string, path: string, handler: RouteHandler): CompiledRoute {
  const keys: string[] = [];
  const pattern = new RegExp(
    '^' +
      path
        .replace(/\//g, '\\/')
        .replace(/:(\w+)/g, (_, key: string) => {
          keys.push(key);
          return '([^/]+)';
        }) +
      '$'
  );
  return { method, pattern, keys, handler };
}

function parseCreateMapping(body: unknown): CreateMappingInput {
  if (!isRecord(body)) {
    throw createBadRequest('Invalid JSON body');
  }
  const sourceValue = coerceString(body.sourceValue);
  const targetValue = coerceString(body.targetValue);
  const notes = body.notes === undefined || body.notes === null ? null : coerceString(body.notes);

  if (!sourceValue) {
    throw createBadRequest('sourceValue is required');
  }
  if (!targetValue) {
    throw createBadRequest('targetValue is required');
  }

  return { sourceValue, targetValue, notes };
}

function parseUpdateMapping(body: unknown): UpdateMappingInput {
  if (!isRecord(body)) {
    throw createBadRequest('Invalid JSON body');
  }
  const result: UpdateMappingInput = {};
  if (body.sourceValue !== undefined) {
    result.sourceValue = coerceString(body.sourceValue);
  }
  if (body.targetValue !== undefined) {
    result.targetValue = coerceString(body.targetValue);
  }
  if (body.notes !== undefined) {
    result.notes = body.notes === null ? null : coerceString(body.notes);
  }
  return result;
}

function isValidUuid(value: string | undefined): value is string {
  if (typeof value !== 'string') {
    return false;
  }
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function isRecord(value: unknown): value is Record<string, any> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function coerceString(value: unknown): string {
  if (typeof value === 'string') {
    return value.trim();
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  throw createBadRequest('Expected string');
}

function createBadRequest(message: string): Error {
  const error = new Error(message);
  (error as Error & { status?: number }).status = 400;
  return error;
}
