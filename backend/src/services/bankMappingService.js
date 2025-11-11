const DEFAULT_LIMIT = 1000;

export class BankMappingService {
  constructor(pool) {
    this.pool = pool;
  }

  async list({ search } = {}) {
    const values = [];
    let query = `
      SELECT id, bank_name, created_on, updated_on
      FROM bank_mapping
    `;

    if (search) {
      values.push(`%${search.toLowerCase()}%`);
      query += `WHERE LOWER(bank_name) LIKE $${values.length}`;
    }

    query += '\nORDER BY bank_name ASC\nLIMIT ' + DEFAULT_LIMIT;

    const { rows } = await this.pool.query(query, values);
    return rows;
  }

  async get(id) {
    const { rows } = await this.pool.query(
      `SELECT * FROM bank_mapping WHERE id = $1`,
      [id]
    );
    return rows[0] ?? null;
  }

  async getByBankName(bankName) {
    const { rows } = await this.pool.query(
      `SELECT * FROM bank_mapping WHERE bank_name = $1`,
      [bankName]
    );
    return rows[0] ?? null;
  }

  async create(payload) {
    const {
      bank_name,
      booking_date = [],
      amount = [],
      booking_text = [],
      booking_type = [],
      booking_date_parse_format = '',
      without_header = false,
      detection_hints = {},
    } = payload;

    const { rows } = await this.pool.query(
      `INSERT INTO bank_mapping (
        bank_name,
        booking_date,
        amount,
        booking_text,
        booking_type,
        booking_date_parse_format,
        without_header,
        detection_hints
      ) VALUES ($1, $2::text[], $3::text[], $4::text[], $5::text[], $6, $7, $8::jsonb)
      RETURNING *`,
      [
        bank_name,
        booking_date,
        amount,
        booking_text,
        booking_type,
        booking_date_parse_format,
        without_header,
        JSON.stringify(detection_hints),
      ]
    );

    return rows[0];
  }

  async update(id, payload) {
    const {
      bank_name,
      booking_date = [],
      amount = [],
      booking_text = [],
      booking_type = [],
      booking_date_parse_format = '',
      without_header = false,
      detection_hints = {},
    } = payload;

    const { rows } = await this.pool.query(
      `UPDATE bank_mapping SET
        bank_name = $1,
        booking_date = $2::text[],
        amount = $3::text[],
        booking_text = $4::text[],
        booking_type = $5::text[],
        booking_date_parse_format = $6,
        without_header = $7,
        detection_hints = $8::jsonb,
        updated_on = now()
      WHERE id = $9
      RETURNING *`,
      [
        bank_name,
        booking_date,
        amount,
        booking_text,
        booking_type,
        booking_date_parse_format,
        without_header,
        JSON.stringify(detection_hints),
        id,
      ]
    );

    return rows[0];
  }
}
