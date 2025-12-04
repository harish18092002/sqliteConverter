import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { UserController } from "./main";

const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "http://localhost:4200";

const app = new Elysia()
  .use(
    cors({
      origin: FRONTEND_ORIGIN,
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Accept", "Authorization"],
      credentials: false,
    })
  )
  .use(UserController);

const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const server = app.listen(port);

console.log(`Server running on port ${port}`);
