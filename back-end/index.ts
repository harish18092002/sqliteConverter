import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { UserController } from "./main";

console.log(
  "🟢 Backend startup: Loading index.ts at " + new Date().toISOString()
);
// Allow multiple origins for dev and prod
const ALLOWED_ORIGINS = [
  "http://localhost:4200",
  "https://sqliteconverter.web.app",
  "https://sqliteconverter.firebaseapp.com",
];

const app = new Elysia()
  .use(
    cors({
      origin: ALLOWED_ORIGINS,
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Accept", "Authorization"],
      credentials: false,
    })
  )
  .use(UserController);

const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const server = app.listen(port);

console.log(`Server running on port ${port}`);
