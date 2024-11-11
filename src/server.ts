import fastify from "fastify";
import { env } from "./env";
import TransactionsRoutes from "./routes/transactions";
import  cookie  from "@fastify/cookie";

const app = fastify();

app.register(cookie)
app.register(TransactionsRoutes)

app.listen({ port: env.PORT }).then(() => {
  console.log(`server is running on port ${env.PORT}`);
});
