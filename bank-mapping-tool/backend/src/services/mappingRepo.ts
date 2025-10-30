import { pool } from './db.js';
import type { BankMapping, BankMappingUpsertInput } from '../types/mapping.js';

const columns = [
  'id',
  'bank_name',
  'booking_date',
  'amount',
  'booking_text',
  'booking_type',
  'booking_date_parse_format',
  'without_header',
  'detection_hints',
  'created_on',
  'updated_on'
] as const;

const toBankMapping = (row: any): BankMapping => ({
  id: row.id,
  bank_name: row.bank_name,
  booking_date: row.booking_date ?? [],
  amount: row.amount ?? [],
  booking_text: row.booking_text ?? [],
  booking_type: row.booking_type ?? [],
  booking_date_parse_format: row.booking_date_parse_format ?? '',
  without_header: row.without_header ?? false,
  detection_hints: row.detection_hints ?? {},
  created_on: row.created_on?.toISOString?.() ?? row.created_on,
  updated_on: row.updated_on?.toISOString?.() ?? row.updated_on
});

export const listMappings = async (): Promise<BankMapping[]> => {
  const result = await pool.query(`SELECT ${columns.join(', ')} FROM banking_mappings ORDER BY bank_name ASC`);
  return result.rows.map(toBankMapping);
};

export const getMappingByBank = async (bankName: string): Promise<BankMapping | null> => {
  const result = await pool.query(
    `SELECT ${columns.join(', ')} FROM banking_mappings WHERE bank_name = $1 LIMIT 1`,
    [bankName]
  );
  return result.rows[0] ? toBankMapping(result.rows[0]) : null;
};

export const upsertMapping = async (input: BankMappingUpsertInput): Promise<BankMapping> => {
  const result = await pool.query(
    `INSERT INTO banking_mappings (
      bank_name, booking_date, amount, booking_text, booking_type,
      booking_date_parse_format, without_header, detection_hints, updated_on
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8, now())
    ON CONFLICT (bank_name)
    DO UPDATE SET
      booking_date = EXCLUDED.booking_date,
      amount = EXCLUDED.amount,
      booking_text = EXCLUDED.booking_text,
      booking_type = EXCLUDED.booking_type,
      booking_date_parse_format = EXCLUDED.booking_date_parse_format,
      without_header = EXCLUDED.without_header,
      detection_hints = EXCLUDED.detection_hints,
      updated_on = now()
    RETURNING ${columns.join(', ')}`,
    [
      input.bank_name,
      input.booking_date,
      input.amount,
      input.booking_text,
      input.booking_type,
      input.booking_date_parse_format,
      input.without_header,
      input.detection_hints
    ]
  );

  return toBankMapping(result.rows[0]);
};
