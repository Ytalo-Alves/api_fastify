import type { FastifyInstance } from "fastify";
import { knex } from "../database";
import { z } from "zod";
import { randomUUID } from "crypto";

export default function TransactionsRoutes(app: FastifyInstance){
   app.post("/transactions", async (request, reply) => {

    const createTransactionBodySchema = z.object({
      title: z.string(),
      amount: z.number(),
      type: z.enum(['credit', 'debit'])
    })

    const { title, amount, type } = createTransactionBodySchema.parse(request.body)

    let sessionId = request.cookies.sessionId

    if (!sessionId){
      sessionId = randomUUID()
      reply.cookie('sessionId', sessionId, {
        path: '/',
        maxAge: 60 * 60, // 1 hour
      })
    }

    await knex('transactions').insert({
      id: randomUUID(),
      title,
      amount: type === 'credit' ? amount : amount * -1,
      session_Id: sessionId,
    })
  
    return reply.status(201).send()
  });

  app.get("/transactions", async (request, reply) => {
    const cookie = request.cookies

    const transactions = await knex('transactions').select('*')

    return reply.send(transactions)
  })

  const getTransactionParamsSchema = z.object({
    id: z.string().uuid()
  })
 
  app.get('/transactions/:id', async (request, reply) => {
    const { id } = getTransactionParamsSchema.parse(request.params)
    const transaction = await knex('transactions').where('id', id).first()



    return {transaction}
  })

  app.get('/summary', async () => {
    const summary = await knex('transactions').sum('amount', {as: 'amount'}).first()
    const formattedAmount = summary ? new Intl.NumberFormat('pt-BR', {
      style: 'decimal', 
      currency:'BRL'
    }).format(Number(summary.amount)): null;

    return { summary: {amount: formattedAmount} }
  })
}