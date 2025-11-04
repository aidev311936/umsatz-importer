import type { IncomingMessage } from 'http';

export interface DatabaseConfig {
  connectionString?: string;
  ssl?: boolean | { rejectUnauthorized: boolean };
}

export interface MappingRecord {
  id: string;
  sourceValue: string;
  targetValue: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMappingInput {
  sourceValue: string;
  targetValue: string;
  notes?: string | null;
}

export interface UpdateMappingInput {
  sourceValue?: string;
  targetValue?: string;
  notes?: string | null;
}

export interface AiCompletionRequest {
  prompt: string;
  systemInstructions?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface AiCompletionResult {
  content: string;
  finishReason: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  raw?: unknown;
}

export interface AiCompletionClient {
  readonly isEnabled: boolean;
  createCompletion(request: AiCompletionRequest): Promise<AiCompletionResult>;
}

export interface MappingsRepository {
  ensureSchema(): Promise<void>;
  list(): Promise<MappingRecord[]>;
  get(id: string): Promise<MappingRecord | null>;
  create(input: CreateMappingInput): Promise<MappingRecord>;
  update(id: string, input: UpdateMappingInput): Promise<MappingRecord | null>;
  remove(id: string): Promise<boolean>;
}

export interface RouteResponse {
  status?: number;
  body?: unknown;
  headers?: Record<string, string>;
}

export interface RequestContext {
  req: IncomingMessage;
  method: string;
  url: URL;
  params: Record<string, string>;
  query: URLSearchParams;
  body: unknown;
  repo: MappingsRepository;
  ai: AiCompletionClient;
}

export type RouteHandler = (ctx: RequestContext) => Promise<RouteResponse | void> | RouteResponse | void;

export interface RouteMatch {
  handler: RouteHandler;
  params: Record<string, string>;
}

export interface Router {
  match(method: string, pathname: string): RouteMatch | null;
}
