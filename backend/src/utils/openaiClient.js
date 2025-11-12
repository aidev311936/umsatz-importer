import fetch from 'node-fetch';

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

  const res = await fetch(`https://api.openai.com/v1/assistants/${resolvedAssistantId}/responses`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'OpenAI-Beta': 'assistants=v2',
    },
    body: JSON.stringify({ input: csvSample }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI ${res.status}: ${err}`);
  }

  const data = await res.json();

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
