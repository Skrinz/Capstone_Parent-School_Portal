export interface ImportFailure {
  input: string;
  message: string;
}

export interface ImportSummaryData {
  replaced: number;
  added: number;
  unchanged: number;
  failed: number;
  totalProcessed: number;
  failures: ImportFailure[];
}

export interface ImportSummaryResponse {
  message?: string;
  summary?: Partial<ImportSummaryData>;
  data?: unknown;
}

export const emptyImportSummary: ImportSummaryData = {
  replaced: 0,
  added: 0,
  unchanged: 0,
  failed: 0,
  totalProcessed: 0,
  failures: [],
};

const toRecord = (value: unknown): Record<string, unknown> | null => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
};

const toCount = (value: unknown) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
};

const normalizeFailures = (value: unknown): ImportFailure[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      const record = toRecord(item);
      if (!record) return null;

      const input = typeof record.input === 'string'
        ? record.input
        : typeof record.row === 'string'
          ? record.row
          : 'Unknown entry';

      const message = typeof record.message === 'string'
        ? record.message
        : typeof record.error === 'string'
          ? record.error
          : 'Import failed.';

      return { input, message };
    })
    .filter((item): item is ImportFailure => item !== null);
};

export const resolveImportSummary = (response: unknown): ImportSummaryData => {
  const topLevel = toRecord(response);
  const dataRecord = toRecord(topLevel?.data);
  const summaryRecord =
    toRecord(topLevel?.summary) ??
    toRecord(dataRecord?.summary) ??
    dataRecord ??
    topLevel;

  const resolved: ImportSummaryData = {
    replaced: toCount(summaryRecord?.replaced),
    added: toCount(summaryRecord?.added),
    unchanged: toCount(summaryRecord?.unchanged),
    failed: toCount(summaryRecord?.failed),
    totalProcessed: toCount(summaryRecord?.totalProcessed),
    failures: normalizeFailures(summaryRecord?.failures),
  };

  if (!resolved.totalProcessed) {
    resolved.totalProcessed =
      resolved.replaced + resolved.added + resolved.unchanged + resolved.failed;
  }

  return resolved;
};
