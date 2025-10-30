import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { listMappings, upsertMapping } from '../services/mappingRepo.js';
import type { BankMappingUpsertInput } from '../types/mapping.js';

const mappingSchema = z.object({
  bank_name: z.string().min(2).max(64),
  booking_date: z.array(z.string()).default([]),
  amount: z.array(z.string()).default([]),
  booking_text: z.array(z.string()).default([]),
  booking_type: z.array(z.string()).default([]),
  booking_date_parse_format: z.string().min(1),
  without_header: z.boolean(),
  detection_hints: z.record(z.unknown()).default({})
}).superRefine((data, ctx) => {
  const hasRequiredFields =
    data.booking_date.length > 0 || data.amount.length > 0 || data.booking_text.length > 0;
  if (!hasRequiredFields) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'At least one mapping field must be provided',
      path: ['booking_date']
    });
  }
});

export const getMappings = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const mappings = await listMappings();
    res.json(mappings);
  } catch (error) {
    next(error);
  }
};

export const saveMapping = async (req: Request<unknown, unknown, BankMappingUpsertInput>, res: Response, next: NextFunction) => {
  try {
    const data = mappingSchema.parse(req.body);
    const saved = await upsertMapping(data);
    res.status(201).json(saved);
  } catch (error) {
    next(error);
  }
};

export const mappingSchemaValidator = mappingSchema;
