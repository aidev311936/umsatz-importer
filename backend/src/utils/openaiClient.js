import fetch from 'node-fetch';

const OPENAI_BASE_URL = 'https://api.openai.com/v1';

export async function requestMappingSuggestion({
  assistantId,
  csvSample,
  analysis,
  additionalContext,
}) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    const error = new Error('OPENAI_API_KEY is not configured');
    error.status = 501;
    throw error;
  }

  if (!assistantId) {
    const error = new Error('OPENAI_ASSISTANT_ID is not configured');
    error.status = 501;
    throw error;
  }

  const response = await fetch(`${OPENAI_BASE_URL}/responses`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      assistant_id: assistantId,
      input: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: JSON.stringify({ csvSample, analysis, additionalContext }),
            },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const error = new Error(`OpenAI API error: ${response.status}`);
    error.status = response.status;
    error.details = await response.text();
    throw error;
  }

  const data = await response.json();
  const message = data.output?.[0]?.content?.[0]?.text;
  if (!message) {
    throw new Error('OpenAI API did not return a suggestion payload');
  }

  return JSON.parse(message);
}
