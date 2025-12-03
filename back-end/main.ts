import { Elysia, t } from "elysia";
import { Database } from "bun:sqlite";
import { unlink, stat, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { existsSync } from "node:fs";

export const UserController = (app: Elysia) => {
  app.post(
    "/convert",
    async ({ body }) => {
      const { file } = body;

      console.log("=== Convert Request Started ===");
      console.log("File received:", file);
      console.log("File type:", file?.constructor?.name);
      console.log("File size:", file instanceof Blob ? file.size : "N/A");

      if (!file || !(file instanceof Blob)) {
        console.log("ERROR: No valid file provided");
        return { success: false, error: "No file provided" };
      }

      const tempDir = join(import.meta.dir, "temp");
      if (!existsSync(tempDir)) {
        await mkdir(tempDir, { recursive: true });
        console.log("Created temp directory:", tempDir);
      }

      const tempPath = join(tempDir, `sqlite_${Date.now()}.db`);
      console.log("Temp file path:", tempPath);

      try {
        const arrayBuffer = await file.arrayBuffer();
        console.log("ArrayBuffer size:", arrayBuffer.byteLength);

        await Bun.write(tempPath, arrayBuffer);
        console.log("File written to:", tempPath);

        const fileStats = await stat(tempPath);
        console.log("Written file size:", fileStats.size);
        console.log("File exists:", existsSync(tempPath));

        const db = new Database(tempPath);
        console.log("Database opened successfully");

        db.exec("PRAGMA journal_mode = DELETE;");
        console.log("Journal mode set to DELETE");

        const tables = db
          .query(
            "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
          )
          .all() as { name: string }[];

        console.log(
          "Tables found:",
          tables.map((t) => t.name)
        );

        const result: Record<string, unknown[]> = {};

        for (const table of tables) {
          const tableName = table.name;
          const rows = db.query(`SELECT * FROM "${tableName}"`).all();
          console.log(`Table "${tableName}": ${rows.length} rows`);
          result[tableName] = rows;
        }

        db.close();
        console.log("Database closed");

        await unlink(tempPath);
        console.log("Temp file deleted");

        console.log("=== Convert Request Completed ===");
        return {
          success: true,
          tables: Object.keys(result),
          data: result,
        };
      } catch (error) {
        console.log("=== ERROR ===");
        console.log("Error type:", error?.constructor?.name);
        console.log(
          "Error message:",
          error instanceof Error ? error.message : error
        );
        console.log(
          "Error stack:",
          error instanceof Error ? error.stack : "N/A"
        );

        try {
          await unlink(tempPath);
          console.log("Temp file cleaned up after error");
        } catch (cleanupError) {
          console.log("Failed to cleanup temp file:", cleanupError);
        }

        return {
          success: false,
          error:
            error instanceof Error
              ? error.message
              : "Failed to parse SQLite database",
        };
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
