import { parse } from 'csv-parse/sync';

const DATE_PATTERNS = [
  { regex: /^\d{2}\.\d{2}\.\d{4}$/, format: 'dd.MM.yyyy' },
  { regex: /^\d{4}-\d{2}-\d{2}$/, format: 'yyyy-MM-dd' },
  {
    regex: /^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}:\d{2}(\.\d{1,6})?$/,
    format: 'yyyy-MM-dd HH:mm:ss.SSSSSS',
  },
  { regex: /^\d{2}\.\d{2}\.\d{4}\s+\d{2}:\d{2}(:\d{2})?$/, format: 'dd.MM.yyyy HH:mm:ss' },
];

function normaliseValue(value) {
  if (typeof value !== 'string') return '';
  return value.trim();
}

function detectDateFormat(value) {
  const cleaned = normaliseValue(value);
  for (const { regex, format } of DATE_PATTERNS) {
    if (regex.test(cleaned)) {
      return format;
    }
  }
  return null;
}

function classifyValue(value) {
  const trimmed = normaliseValue(value);
  if (!trimmed) return 'empty';
  if (!Number.isNaN(Number(trimmed.replace(',', '.')))) return 'number';
  if (detectDateFormat(trimmed)) return 'date';
  return 'text';
}

function detectHeader(rows) {
  if (rows.length === 0) return { header: null, dataStart: 0 };

  for (let i = 0; i < rows.length; i += 1) {
    const row = rows[i].map(normaliseValue);
    const nonEmpty = row.filter(Boolean);
    if (nonEmpty.length === 0) {
      continue;
    }

    const hasDate = nonEmpty.some((value) => detectDateFormat(value));
    const numericCount = nonEmpty.filter((value) => !Number.isNaN(Number(value.replace(',', '.')))).length;
    const textCount = nonEmpty.length - numericCount;

    if (!hasDate && textCount >= numericCount) {
      return { header: row, dataStart: i + 1 };
    }

    if (i === 0) {
      return { header: null, dataStart: 0 };
    }
  }

  return { header: null, dataStart: 0 };
}

function detectColumnMarkers(row) {
  return row.map((value) => classifyValue(value));
}

function trimEmptyRows(rows) {
  return rows.filter((row) => row.some((value) => normaliseValue(value) !== ''));
}

export function analyseCsv(buffer, delimiter = ';') {
  const input = buffer.toString('utf-8');

  const rows = trimEmptyRows(
    parse(input, {
      delimiter,
      skip_empty_lines: false,
    })
  );

  if (!rows.length) {
    return {
      rows: [],
      without_header: true,
      column_count: 0,
      column_markers: [],
      header_signature: [],
      booking_date_parse_format: '',
    };
  }

  const { header, dataStart } = detectHeader(rows);
  const dataRows = rows.slice(dataStart).filter((row) => row.length);
  const firstDataRow = dataRows[0] ?? [];
  const columnMarkers = detectColumnMarkers(firstDataRow);

  let bookingDateFormat = '';
  for (const row of dataRows) {
    for (const cell of row) {
      const format = detectDateFormat(cell);
      if (format) {
        bookingDateFormat = format;
        break;
      }
    }
    if (bookingDateFormat) break;
  }

  const analysis = {
    rows: dataRows.slice(0, 20),
    without_header: !header,
    column_count: firstDataRow.length,
    column_markers: columnMarkers,
    header_signature: header?.map(normaliseValue) ?? [],
    booking_date_parse_format: bookingDateFormat,
  };

  return analysis;
}
