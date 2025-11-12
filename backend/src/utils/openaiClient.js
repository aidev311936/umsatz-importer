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

  const client = getClient();

  const thread = await client.beta.threads.create();
  await client.beta.threads.messages.create(thread.id, {
    role: 'user',
    content: csvSample,
  });

  let run = await client.beta.threads.runs.create(thread.id, {
    assistant_id: resolvedAssistantId,
  });

  while (run.status === 'queued' || run.status === 'in_progress') {
    await new Promise((r) => setTimeout(r, 800));
    run = await client.beta.threads.runs.retrieve(thread.id, run.id);
  }
  if (run.status !== 'completed') {
    throw new Error(
      `Run failed with status=${run.status}, details=${JSON.stringify(run.last_error || {})}`
    );
  }

  const list = await client.beta.threads.messages.list(thread.id, { order: 'desc', limit: 1 });
  const msg = list.data?.[0];
  const part = msg?.content?.[0];

  let raw =
    part?.text?.value ??
    (typeof part?.text === 'string' ? part.text : undefined) ??
    run?.output_text;
  if (!raw) {
    throw new Error('OpenAI API did not return a suggestion payload');
  }

  const result = typeof raw === 'string' ? JSON.parse(raw) : raw;
  return result;
}
