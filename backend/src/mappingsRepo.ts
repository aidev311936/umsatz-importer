import { randomUUID } from 'crypto';
import type * as pg from 'pg';
import {
  CreateMappingInput,
  MappingRecord,
  MappingsRepository,
  UpdateMappingInput,
} from './types.js';

type Pool = pg.Pool;

export class PostgresMappingsRepository implements MappingsRepository {
  constructor(private readonly pool: Pool) {}

  async ensureSchema(): Promise<void> {
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS mappings (
        id UUID PRIMARY KEY,
        source_value TEXT NOT NULL,
        target_value TEXT NOT NULL,
        notes TEXT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
  }

  async list(): Promise<MappingRecord[]> {
    const result = await this.pool.query(
      'SELECT id, source_value, target_value, notes, created_at, updated_at FROM mappings ORDER BY created_at DESC'
    );
    return result.rows.map(mapRow);
  }

  async get(id: string): Promise<MappingRecord | null> {
    const result = await this.pool.query(
      'SELECT id, source_value, target_value, notes, created_at, updated_at FROM mappings WHERE id = $1',
      [id]
    );
    const row = result.rows[0];
    return row ? mapRow(row) : null;
  }

  async create(input: CreateMappingInput): Promise<MappingRecord> {
    const id = randomUUID();
    const result = await this.pool.query(
      `INSERT INTO mappings (id, source_value, target_value, notes)
       VALUES ($1, $2, $3, $4)
       RETURNING id, source_value, target_value, notes, created_at, updated_at`,
      [id, input.sourceValue, input.targetValue, input.notes ?? null]
    );
    return mapRow(result.rows[0]);
  }

  async update(id: string, input: UpdateMappingInput): Promise<MappingRecord | null> {
    const fields: string[] = [];
    const values: unknown[] = [];

    if (typeof input.sourceValue === 'string') {
      values.push(input.sourceValue);
      fields.push(`source_value = $${values.length}`);
    }
    if (typeof input.targetValue === 'string') {
      values.push(input.targetValue);
      fields.push(`target_value = $${values.length}`);
    }
    if (input.notes !== undefined) {
      values.push(input.notes);
      fields.push(`notes = $${values.length}`);
    }

    if (!fields.length) {
      const current = await this.get(id);
      return current;
    }

    values.push(id);
    const updateParts = fields.join(', ');
    const query = `
      UPDATE mappings
         SET ${updateParts}, updated_at = NOW()
       WHERE id = $${values.length}
       RETURNING id, source_value, target_value, notes, created_at, updated_at`;
    const result = await this.pool.query(query, values);
    const row = result.rows[0];
    return row ? mapRow(row) : null;
  }

  async remove(id: string): Promise<boolean> {
    const result = await this.pool.query('DELETE FROM mappings WHERE id = $1', [id]);
    return result.rowCount > 0;
  }
}

type MappingRow = {
  id: string;
  source_value: string;
  target_value: string;
  notes: string | null;
  created_at: Date;
  updated_at: Date;
};

function mapRow(row: MappingRow): MappingRecord {
  return {
    id: row.id,
    sourceValue: row.source_value,
    targetValue: row.target_value,
    notes: row.notes,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}
