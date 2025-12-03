import { Elysia } from "elysia";

export const UserController = new Elysia().get("/convert", () => ({
  message: "Convert",
}));
