import OpenAI from 'openai';
import type { ThreadMessage } from 'openai/resources/beta/threads/messages/messages.mjs';
import type { Run } from 'openai/resources/beta/threads/runs/runs.mjs';
import { getEnv } from '../utils/parseEnv.js';

const { OPENAI_API_KEY, OPENAI_ASSISTANT_ID } = getEnv();

const client = new OpenAI({ apiKey: OPENAI_API_KEY });

export type AssistantMessage = {
  role: 'user' | 'assistant' | 'tool';
  content: string;
};

export const createThread = async (messages: AssistantMessage[]) => {
  const thread = await client.beta.threads.create({
    messages: messages.map((message) => ({
      role: message.role,
      content: [{ type: 'text', text: message.content }]
    }))
  });
  return thread.id;
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const runAssistant = async (
  threadId: string,
  timeoutMs = 30000,
  options?: { responseFormat?: 'json_object' | 'text' }
): Promise<string> => {
  const startedAt = Date.now();
  let run: Run = await client.beta.threads.runs.create(threadId, {
    assistant_id: OPENAI_ASSISTANT_ID,
    response_format: options?.responseFormat
      ? ({ type: options.responseFormat } as { type: 'json_object' | 'text' })
      : undefined
  });

  while (true) {
    if (run.status === 'completed') {
      return run.id;
    }

    if (['failed', 'cancelled', 'expired'].includes(run.status)) {
      throw new Error(`Assistant run ${run.status}`);
    }

    if (Date.now() - startedAt > timeoutMs) {
      throw new Error('Assistant run timed out');
    }

    await sleep(1000);
    run = await client.beta.threads.runs.retrieve(threadId, run.id);
  }
};

export const getLastAssistantMessageAsJson = async (threadId: string): Promise<unknown> => {
  const messages = await client.beta.threads.messages.list(threadId, { limit: 20 });
  const lastAssistantMessage = messages.data.find((message) => message.role === 'assistant');
  if (!lastAssistantMessage) {
    throw new Error('Assistant did not return a message');
  }

  const textBlock = extractText(lastAssistantMessage);

  try {
    return JSON.parse(textBlock);
  } catch (error) {
    throw new Error('Assistant response was not valid JSON');
  }
};

const extractText = (message: ThreadMessage): string => {
  const textParts = message.content
    .map((part) => (part.type === 'text' ? part.text.value : ''))
    .filter(Boolean);
  if (!textParts.length) {
    throw new Error('Assistant response was empty');
  }
  return textParts.join('\n');
};
