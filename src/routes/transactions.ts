import type { FastifyInstance } from "fastify";
import { knex } from "../database";
import { z } from "zod";
import { randomUUID } from "crypto";
import checkSessionIdExists from "../middlewares/check-session-id-exists";



export default function TransactionsRoutes(app: FastifyInstance) {

  const getTransactionParamsSchema = z.object({
    id: z.string().uuid(),
  });



  app.post("/transactions", async (request, reply) => {
    const createTransactionBodySchema = z.object({
      title: z.string(),
      amount: z.number(),
      type: z.enum(["credit", "debit"]),
    });

    const { title, amount, type } = createTransactionBodySchema.parse(
      request.body
    );

    let sessionId = request.cookies.sessionId;

    if (!sessionId) {
      sessionId = randomUUID();
      reply.cookie("sessionId", sessionId, {
        path: "/",
        maxAge: 60 * 60, // 1 hour
      });
    }

    await knex("transactions").insert({
      id: randomUUID(),
      title,
      amount: type === "credit" ? amount : amount * -1,
      session_Id: sessionId,
    });

    return reply.status(201).send();
  });

  app.get("/transactions",{ preHandler: [checkSessionIdExists] }, async (request, reply) => {
      const { sessionId } = request.cookies;

      if (!sessionId) {
        return reply.status(401).send({ error: "Unauthorized" });
      }

      const transactions = await knex("transactions")
        .where("session_id", sessionId)
        .select();

      return reply.send({transactions});
    }
  );


  app.get("/transactions/:id",{preHandler: [checkSessionIdExists]} , async (request) => {
    const { id } = getTransactionParamsSchema.parse(request.params);
    const { sessionId } = request.cookies;

    const transaction = await knex("transactions")
    .where({
      session_Id: sessionId,
      id,
    })
    .first();

    return { transaction };
  });

  app.get("/summary",{preHandler: [checkSessionIdExists]}, async (request) => {

    const { sessionId } = request.cookies;

    const summary = await knex("transactions")
      .sum("amount", { as: "amount" })
      .where('session_id', sessionId)
      .first();
    const formattedAmount = summary
      ? new Intl.NumberFormat("pt-BR", {
          style: "decimal",
          currency: "BRL",
        }).format(Number(summary.amount))
      : null;

    return { summary };
  });
}
