import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { sniffCsv } from '../services/csvSniffer.js';
import { createThread, runAssistant, getLastAssistantMessageAsJson } from '../services/openaiService.js';
import { getEnv } from '../utils/parseEnv.js';

const env = getEnv();

const aiRequestSchema = z.object({
  csv: z.string().min(1, 'csv is required'),
  sampleLimit: z.number().int().positive().optional(),
  userBankGuess: z.string().min(2).max(128).optional()
});

const aiResponseSchema = z.object({
  booking_date: z.array(z.string()),
  amount: z.array(z.string()),
  booking_text: z.array(z.string()),
  booking_type: z.array(z.string()),
  booking_date_parse_format: z.string(),
  without_header: z.boolean(),
  detection_hints: z.record(z.unknown())
});

const MAX_SAMPLE_BYTES = 64 * 1024;

export const detectMapping = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { csv, sampleLimit, userBankGuess } = aiRequestSchema.parse(req.body);

    const effectiveLimit = Math.min(sampleLimit ?? env.AI_SAMPLE_LIMIT, env.AI_SAMPLE_LIMIT);
    const sniff = sniffCsv(csv, effectiveLimit);
    const csvLines = csv.split(/\r?\n/).slice(0, effectiveLimit);
    let csvSample = csvLines.join('\n');

    if (Buffer.byteLength(csvSample, 'utf8') > MAX_SAMPLE_BYTES) {
      while (Buffer.byteLength(csvSample, 'utf8') > MAX_SAMPLE_BYTES && csvLines.length > 1) {
        csvLines.pop();
        csvSample = csvLines.join('\n');
      }
    }

    const threadId = await createThread([
      {
        role: 'user',
        content: JSON.stringify(
          {
            csv_sample: csvSample,
            sniff_hints: sniff,
            user_bank_guess: userBankGuess ?? null
          },
          null,
          2
        )
      }
    ]);

    await runAssistant(threadId, 30000, { responseFormat: 'json_object' });
    const assistantJson = await getLastAssistantMessageAsJson(threadId);
    const data = aiResponseSchema.parse(assistantJson);

    res.json(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      (error as any).status = 422;
    } else if (error instanceof Error && !(error as any).status) {
      const message = (error as Error).message || '';
      (error as any).status = message.toLowerCase().includes('timed out') ? 504 : 502;
    }
    next(error);
  }
};
