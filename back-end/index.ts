import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { UserController } from "./main";

const FRONTEND_ORIGIN =
  process.env.FRONTEND_ORIGIN ||
  process.env.ALLOWED_ORIGIN ||
  "http://localhost:4200";

const app = new Elysia()
  .use(
    cors({
      origin: FRONTEND_ORIGIN,
      methods: ["GET", "POST", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Accept"],
      credentials: false,
    })
  )
  .onRequest(({ set }) => {
    // Ensure CORS headers are present even if middleware misses an edge case.
    set.headers["Access-Control-Allow-Origin"] = FRONTEND_ORIGIN;
    set.headers["Access-Control-Allow-Methods"] = "GET,POST,OPTIONS";
    set.headers["Access-Control-Allow-Headers"] = "Content-Type,Accept";
  })
  .options("*", ({ set }) => {
    set.status = 204;
  })
  .use(UserController);

const server = app.listen(3456);

console.log(`Listening on http://localhost:${server.server?.port}`);
