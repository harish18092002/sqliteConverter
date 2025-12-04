import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { UserController } from "./main";

const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "http://localhost:4200";

const app = new Elysia()
  .use(
    cors({
      origin: FRONTEND_ORIGIN,
      methods: ["GET", "POST", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Accept"],
      credentials: false,
    })
  )
  .use(UserController);

const server = app.listen(3456);

console.log(`Listening on http://localhost:${server.server?.port}`);
