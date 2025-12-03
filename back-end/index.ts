import { Elysia } from "elysia";
import { UserController } from "./main";

const app = new Elysia();

app.use(UserController);

const server = app.listen(3456);

console.log(`Listening on http://localhost:${server.server?.port}`);
