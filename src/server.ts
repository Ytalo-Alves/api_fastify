import fastify from "fastify";
import { knex } from "./database";
import crypto from 'node:crypto'
import { title } from "node:process";

const app = fastify();
const PORT = 3333;

app.get("/user", async () => {
  const transaction = await knex('transactions').select('*')

  return transaction
});

app.listen({ port: PORT }).then(() => {
  console.log(`server is running on port ${PORT}`);
});
