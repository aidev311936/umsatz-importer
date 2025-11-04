import https from 'https';
import { AiCompletionClient, AiCompletionRequest, AiCompletionResult } from './types.js';

export class OpenAIRestClient implements AiCompletionClient {
  constructor(
    private readonly apiKey: string | undefined,
    private readonly model: string = process.env.OPENAI_MODEL ?? 'gpt-4o-mini'
  ) {}

  get isEnabled(): boolean {
    return Boolean(this.apiKey);
  }

  async createCompletion(request: AiCompletionRequest): Promise<AiCompletionResult> {
    if (!this.apiKey) {
      throw new Error('OpenAI API key is not configured');
    }

    const payload = JSON.stringify({
      model: this.model,
      messages: buildMessages(request),
      temperature: request.temperature ?? 0.2,
      max_tokens: request.maxTokens,
    });

    const responseBody = await postJson('https://api.openai.com/v1/chat/completions', payload, {
      Authorization: `Bearer ${this.apiKey}`,
    });

    if (!responseBody.choices?.length) {
      throw new Error('Unexpected OpenAI response');
    }

    const choice = responseBody.choices[0];
    const messageContent = Array.isArray(choice.message?.content)
      ? choice.message?.content.map((part: { text?: string }) => part.text ?? '').join('\n')
      : choice.message?.content ?? '';

    return {
      content: messageContent,
      finishReason: choice.finish_reason ?? 'unknown',
      usage: responseBody.usage
        ? {
            promptTokens: responseBody.usage.prompt_tokens ?? 0,
            completionTokens: responseBody.usage.completion_tokens ?? 0,
            totalTokens: responseBody.usage.total_tokens ?? 0,
          }
        : undefined,
      raw: responseBody,
    };
  }
}

export class DisabledAiClient implements AiCompletionClient {
  get isEnabled(): boolean {
    return false;
  }

  async createCompletion(): Promise<AiCompletionResult> {
    throw new Error('AI integration is disabled');
  }
}

function buildMessages(request: AiCompletionRequest) {
  const messages = [] as Array<{ role: 'system' | 'user'; content: string }>;
  if (request.systemInstructions) {
    messages.push({ role: 'system', content: request.systemInstructions });
  }
  messages.push({ role: 'user', content: request.prompt });
  return messages;
}

function postJson(url: string, body: string, headers: Record<string, string>): Promise<any> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const req = https.request(
      {
        method: 'POST',
        protocol: parsed.protocol,
        hostname: parsed.hostname,
        port: parsed.port || 443,
        path: `${parsed.pathname}${parsed.search}`,
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'Content-Length': Buffer.byteLength(body),
          ...headers,
        },
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on('data', (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
        res.on('end', () => {
          const text = Buffer.concat(chunks).toString('utf8');
          if (res.statusCode && res.statusCode >= 400) {
            reject(new Error(`OpenAI request failed with status ${res.statusCode}: ${text}`));
            return;
          }
          try {
            const json = text ? JSON.parse(text) : {};
            resolve(json);
          } catch (error) {
            reject(new Error(`Failed to parse OpenAI response: ${(error as Error).message}`));
          }
        });
        res.on('error', (error) => reject(error));
      }
    );

    req.on('error', (error) => reject(error));
    req.write(body);
    req.end();
  });
}

export function createAiClient(): AiCompletionClient {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return new DisabledAiClient();
  }
  return new OpenAIRestClient(apiKey);
}
