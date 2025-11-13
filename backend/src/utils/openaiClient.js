import OpenAI from 'openai';

let cachedClient;
const assistantModelCache = new Map();

function getClient(apiKey) {
  if (!cachedClient) {
    cachedClient = new OpenAI({ apiKey });
  }
  return cachedClient;
}

async function resolveModel(client, assistantId) {
  if (assistantModelCache.has(assistantId)) {
    return assistantModelCache.get(assistantId);
  }

  let resolvedModel;
  try {
    const assistant = await client.beta.assistants.retrieve(assistantId);
    resolvedModel = assistant?.model;
  } catch (error) {
    // fall back to configured model; downstream error will mention missing config
    if (process.env.NODE_ENV !== 'production') {
      console.warn('Failed to read assistant configuration from OpenAI API', error);
    }
  }

  resolvedModel = resolvedModel ?? process.env.OPENAI_MODEL;
  if (!resolvedModel) {
    const message =
      'Unable to determine the OpenAI model. Ensure your assistant has a model or set OPENAI_MODEL.';
    const modelError = new Error(message);
    modelError.status = 501;
    throw modelError;
  }

  assistantModelCache.set(assistantId, resolvedModel);
  return resolvedModel;
}

export async function requestMappingSuggestion({ assistantId, csvSample }) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    const error = new Error('OPENAI_API_KEY is not configured');
    error.status = 501;
    throw error;
  }

  const resolvedAssistantId = assistantId ?? process.env.OPENAI_ASSISTANT_ID;
  if (!resolvedAssistantId) {
    const error = new Error('OPENAI_ASSISTANT_ID is not configured');
    error.status = 501;
    throw error;
  }

  if (!csvSample) {
    throw new Error('csvSample is required');
  }

  const client = getClient(apiKey);
  const model = await resolveModel(client, resolvedAssistantId);

  const data = await client.responses.create({
    assistant_id: resolvedAssistantId,
    model,
    input: csvSample,
  });

  const first = data?.output?.[0];
  const part = first?.content?.[0];

  let raw =
    part?.text?.value ??
    (typeof part?.text === 'string' ? part.text : undefined) ??
    data?.output_text;
  if (!raw) {
    throw new Error('OpenAI API did not return a suggestion payload');
  }

  const result = typeof raw === 'string' ? JSON.parse(raw) : raw;
  return result;
}
