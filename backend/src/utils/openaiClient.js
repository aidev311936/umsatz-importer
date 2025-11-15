import OpenAI from 'openai';

let cachedClient;

function getClient(apiKey) {
  if (!cachedClient) {
    cachedClient = new OpenAI({ apiKey });
  }
  return cachedClient;
}

export async function requestMappingSuggestion({ assistantId, csvSample }) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    const error = new Error('OPENAI_API_KEY is not configured');
    error.status = 501;
    throw error;
  }

  if (!csvSample) {
    throw new Error('csvSample is required');
  }

  const resolvedAssistantId = assistantId ?? process.env.OPENAI_ASSISTANT_ID;
  const envModel = process.env.OPENAI_MODEL;

  if (!envModel && !resolvedAssistantId) {
    const error = new Error(
      'OPENAI_ASSISTANT_ID is not configured. Provide an assistant id or set OPENAI_MODEL.'
    );
    error.status = 501;
    throw error;
  }

  const client = getClient(apiKey);
  const requestPayload = { input: csvSample };

  if (envModel) {
    requestPayload.model = envModel;
  } else {
    requestPayload.assistant_id = resolvedAssistantId;
  }

  const data = await client.responses.create(requestPayload);

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
