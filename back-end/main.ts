import { Elysia, t } from "elysia";
import { Database } from "bun:sqlite";
import { unlink, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { existsSync } from "node:fs";
import type {
  ApiResponse,
  ErrorCode,
  ConvertSuccessData,
  TableInfo,
} from "./utils/interface";
import {
  createResponse,
  CONFIG,
  getFileExtension,
  validateSqliteHeader,
} from "./utils/helper";

function createErrorResponse(
  code: ErrorCode,
  message: string,
  startTime: number,
  details?: string
): ApiResponse<null> {
  return createResponse<null>(
    false,
    null,
    { code, message, details },
    startTime
  );
}

export const UserController = (app: Elysia) => {
  app.post(
    "/convert",
    async ({ body }): Promise<ApiResponse<ConvertSuccessData | null>> => {
      const startTime = Date.now();
      const { file } = body;

      console.log("=== Convert Request Started ===");

      // Validation: File exists
      if (!file || !(file instanceof Blob)) {
        console.log("ERROR: No file provided");
        return createErrorResponse(
          "FILE_REQUIRED",
          "No file provided. Please upload a SQLite database file.",
          startTime
        );
      }

      const fileName = file.name || "unknown";
      const fileSize = file.size;

      console.log(`File: ${fileName}, Size: ${fileSize} bytes`);

      if (fileSize > CONFIG.MAX_FILE_SIZE) {
        console.log(
          `ERROR: File too large (${fileSize} > ${CONFIG.MAX_FILE_SIZE})`
        );
        return createErrorResponse(
          "FILE_TOO_LARGE",
          `File size exceeds maximum limit of ${
            CONFIG.MAX_FILE_SIZE / 1024 / 1024
          }MB.`,
          startTime,
          `File size: ${(fileSize / 1024 / 1024).toFixed(2)}MB`
        );
      }

      if (fileSize < CONFIG.MIN_FILE_SIZE) {
        console.log(
          `ERROR: File too small (${fileSize} < ${CONFIG.MIN_FILE_SIZE})`
        );
        return createErrorResponse(
          "FILE_TOO_SMALL",
          "File is too small to be a valid SQLite database.",
          startTime
        );
      }

      const extension = getFileExtension(fileName);
      if (
        extension &&
        !CONFIG.ALLOWED_EXTENSIONS.includes(
          extension as (typeof CONFIG.ALLOWED_EXTENSIONS)[number]
        )
      ) {
        console.log(`ERROR: Invalid extension: ${extension}`);
        return createErrorResponse(
          "INVALID_EXTENSION",
          `Invalid file extension. Allowed: ${CONFIG.ALLOWED_EXTENSIONS.join(
            ", "
          )}`,
          startTime,
          `Received: ${extension || "none"}`
        );
      }

      const arrayBuffer = await file.arrayBuffer();

      if (!validateSqliteHeader(arrayBuffer)) {
        console.log("ERROR: Invalid SQLite header");
        return createErrorResponse(
          "INVALID_SQLITE_FORMAT",
          "File is not a valid SQLite database. Invalid file header.",
          startTime
        );
      }

      // Setup temp file
      const tempDir = join(import.meta.dir, "temp");
      if (!existsSync(tempDir)) {
        await mkdir(tempDir, { recursive: true });
      }

      const tempPath = join(
        tempDir,
        `sqlite_${Date.now()}_${Math.random().toString(36).slice(2)}.db`
      );

      try {
        await Bun.write(tempPath, arrayBuffer);
        console.log(`Temp file created: ${tempPath}`);

        const db = new Database(tempPath);
        db.exec("PRAGMA journal_mode = DELETE;");

        const tables = db
          .query(
            "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
          )
          .all() as { name: string }[];

        if (tables.length === 0) {
          db.close();
          await unlink(tempPath);
          console.log("ERROR: No tables found");
          return createErrorResponse(
            "NO_TABLES_FOUND",
            "The database contains no tables.",
            startTime
          );
        }

        if (tables.length > CONFIG.MAX_TABLES) {
          db.close();
          await unlink(tempPath);
          console.log(`ERROR: Too many tables (${tables.length})`);
          return createErrorResponse(
            "TOO_MANY_TABLES",
            `Database has too many tables. Maximum allowed: ${CONFIG.MAX_TABLES}`,
            startTime,
            `Found: ${tables.length} tables`
          );
        }

        const content: Record<string, unknown[]> = {};
        const tableInfos: TableInfo[] = [];
        let totalRows = 0;

        for (const table of tables) {
          const tableName = table.name;

          const columnsResult = db
            .query(`PRAGMA table_info("${tableName}")`)
            .all() as {
            name: string;
          }[];
          const columns = columnsResult.map((c) => c.name);

          const rows = db
            .query(
              `SELECT * FROM "${tableName}" LIMIT ${CONFIG.MAX_ROWS_PER_TABLE}`
            )
            .all();

          content[tableName] = rows;
          tableInfos.push({
            name: tableName,
            rowCount: rows.length,
            columns,
          });
          totalRows += rows.length;

          console.log(
            `Table "${tableName}": ${rows.length} rows, ${columns.length} columns`
          );
        }

        db.close();
        await unlink(tempPath);

        console.log(
          `=== Convert Completed: ${tables.length} tables, ${totalRows} rows ===`
        );

        return createResponse<ConvertSuccessData>(
          true,
          {
            fileName,
            fileSize,
            tableCount: tables.length,
            totalRows,
            tables: tableInfos,
            content,
          },
          null,
          startTime
        );
      } catch (error) {
        console.log("=== ERROR ===", error);

        try {
          await unlink(tempPath);
        } catch {}

        const message =
          error instanceof Error ? error.message : "Unknown error";
        const isDbError =
          message.includes("database") || message.includes("SQL");

        return createErrorResponse(
          isDbError ? "DATABASE_ERROR" : "INTERNAL_ERROR",
          isDbError
            ? "Failed to read database. The file may be corrupted or encrypted."
            : "An unexpected error occurred while processing the file.",
          startTime,
          message
        );
      }
    },
    {
      body: t.Object({
        file: t.File(),
      }),
    }
  );

  return app;
};
