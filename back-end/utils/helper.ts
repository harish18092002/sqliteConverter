import type { ApiResponse } from "./interface";

export const CONFIG = {
  MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
  MIN_FILE_SIZE: 100, // 100 bytes (minimum valid SQLite file)
  ALLOWED_EXTENSIONS: [".db", ".sqlite", ".sqlite3", ".db3"],
  SQLITE_MAGIC_HEADER: "SQLite format 3\0",
  MAX_TABLES: 1000,
  MAX_ROWS_PER_TABLE: 100000,
} as const;

export function createResponse<T>(
  success: boolean,
  data: T | null,
  error: ApiResponse["error"],
  startTime: number
): ApiResponse<T> {
  return {
    success,
    data,
    error,
    meta: {
      timestamp: new Date().toISOString(),
      processingTimeMs: Date.now() - startTime,
    },
  };
}

export function getFileExtension(filename: string): string {
  const lastDot = filename.lastIndexOf(".");
  return lastDot !== -1 ? filename.slice(lastDot).toLowerCase() : "";
}

export function validateSqliteHeader(buffer: ArrayBuffer): boolean {
  const header = new TextDecoder().decode(buffer.slice(0, 16));
  return header === CONFIG.SQLITE_MAGIC_HEADER;
}
