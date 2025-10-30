const DELIMITERS = [';', ',', '\t', '|'];

export interface CsvSniffResult {
  delimiter: string;
  columnCount: number;
  headerLikely: boolean;
  withoutHeader: boolean;
  firstRows: string[][];
}

const splitLines = (csv: string): string[] =>
  csv
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

const scoreDelimiter = (lines: string[], delimiter: string) => {
  const columnsPerLine = lines.map((line) => line.split(delimiter).length);
  const uniqueCounts = new Set(columnsPerLine);
  return {
    delimiter,
    columnCount: Math.max(...columnsPerLine),
    score: uniqueCounts.size === 1 ? 2 : uniqueCounts.size === 2 ? 1 : 0
  };
};

const looksLikeHeader = (cells: string[]): boolean => {
  if (!cells.length) return false;
  const heuristics = cells.map((cell) => {
    const letters = cell.replace(/[^a-zA-ZäöüÄÖÜß]/g, '').length;
    const numbers = cell.replace(/[^0-9]/g, '').length;
    return letters > 0 && numbers === 0;
  });
  const textyRatio = heuristics.filter(Boolean).length / cells.length;
  return textyRatio >= 0.6;
};

export const sniffCsv = (csv: string, sampleRows = 50): CsvSniffResult => {
  const lines = splitLines(csv).slice(0, sampleRows);
  if (!lines.length) {
    return {
      delimiter: ';',
      columnCount: 0,
      headerLikely: false,
      withoutHeader: true,
      firstRows: []
    };
  }

  const scored = DELIMITERS.map((delimiter) => scoreDelimiter(lines, delimiter)).sort(
    (a, b) => b.score - a.score || b.columnCount - a.columnCount
  );

  const { delimiter, columnCount } = scored[0];
  const rows = lines.map((line) => line.split(delimiter).map((cell) => cell.trim().replace(/^"|"$/g, '')));
  const headerLikely = looksLikeHeader(rows[0]);

  return {
    delimiter,
    columnCount,
    headerLikely,
    withoutHeader: !headerLikely,
    firstRows: rows.slice(0, 5)
  };
};
