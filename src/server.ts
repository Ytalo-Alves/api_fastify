import fastify from "fastify";
import { app } from "./app";
import { env } from "./env";

const host = process.env.RENDER ? '0.0.0.0' : 'localhost';

app.listen({ port: env.PORT, host }).then(() => {
  console.log(`server is running on port ${env.PORT}`);
});
