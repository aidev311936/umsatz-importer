import OpenAI from 'openai';

let client;

function getClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    const error = new Error('OPENAI_API_KEY is not configured');
    error.status = 501;
    throw error;
  }

  if (!client) {
    client = new OpenAI({ apiKey });
  }

  return client;
}

export async function requestMappingSuggestion({ assistantId, csvSample }) {
  const resolvedAssistantId = assistantId ?? process.env.OPENAI_ASSISTANT_ID;
  if (!resolvedAssistantId) {
    const error = new Error('OPENAI_ASSISTANT_ID is not configured');
    error.status = 501;
    throw error;
  }

  if (!csvSample) {
    throw new Error('csvSample is required');
  }

  const response = await getClient().responses.create({
    assistant_id: resolvedAssistantId,
    input: csvSample,
  });

  const raw = response.output?.[0]?.content?.[0]?.text?.value;
  if (!raw) {
    throw new Error('OpenAI API did not return a suggestion payload');
  }

  return JSON.parse(raw);
}
