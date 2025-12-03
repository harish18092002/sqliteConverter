export type ErrorCode =
  | "FILE_REQUIRED"
  | "FILE_TOO_LARGE"
  | "FILE_TOO_SMALL"
  | "INVALID_EXTENSION"
  | "INVALID_SQLITE_FORMAT"
  | "NO_TABLES_FOUND"
  | "TOO_MANY_TABLES"
  | "DATABASE_ERROR"
  | "INTERNAL_ERROR";

export interface TableInfo {
  name: string;
  rowCount: number;
  columns: string[];
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T | null;
  error: {
    code: ErrorCode;
    message: string;
    details?: string;
  } | null;
  meta: {
    timestamp: string;
    processingTimeMs: number;
  };
}

export interface ConvertSuccessData {
  fileName: string;
  fileSize: number;
  tableCount: number;
  totalRows: number;
  tables: TableInfo[];
  content: Record<string, unknown[]>;
}
