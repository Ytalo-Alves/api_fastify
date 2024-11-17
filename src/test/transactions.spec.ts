import { it, beforeAll, afterAll, describe, expect, beforeEach } from "vitest";
import { execSync } from 'node:child_process'
import { app } from "../app";
import request from "supertest";

describe("Transactions Routes", () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    execSync('npm run knex migrate:rollback')
    execSync('npm run knex migrate:latest')
  })


  it("should be able to create a new transaction", async () => {
    const response = await request(app.server)
      .post("/transactions")
      .send({
        title: "New transaction",
        amount: 1000,
        type: "credit",
      })

      .expect(201);
  });

  it("should be able to list all transactions", async () => {
    const createTransactionResponse = await request(app.server)
      .post("/transactions")
      .send({
        title: "New transaction",
        amount: 1000,
        type: "credit",
      });

    const cookies = createTransactionResponse.get("Set-Cookie");

    const listTransactionResponse = await request(app.server)
      .get("/transactions")
      .set("Cookie", cookies)
      .expect(200);

      expect(listTransactionResponse.body.transactions).toEqual([
        expect.objectContaining({
          title: "New transaction",
          amount: 1000
        })
    ])
  });

  it("should be able to get specific transaction", async () => {
    const createTransactionResponse = await request(app.server)
      .post("/transactions")
      .send({
        title: "New transaction",
        amount: 1000,
        type: "credit",
      });

    const cookies = createTransactionResponse.get("Set-Cookie");

    const listTransactionResponse = await request(app.server)
      .get("/transactions")
      .set("Cookie", cookies)
      .expect(200);

      const transactionId = listTransactionResponse.body.transactions[0].id

      const getTransactionResponse = await request(app.server)
      .get(`/transactions/${transactionId}`)
      .set("Cookie", cookies)
      .expect(200);

      expect(getTransactionResponse.body.transaction).toEqual(
        expect.objectContaining({
          title: "New transaction",
          amount: 1000
        })
    )
  });

  it("should be able to get the summary", async () => {
    const createTransactionResponse = await request(app.server)
      .post("/transactions")
      .send({
        title: "New transaction",
        amount: 5000,
        type: "credit",
      });

    const cookies = createTransactionResponse.get("Set-Cookie");

    await request(app.server)
      .post("/transactions")
      .set("Cookie", cookies)
      .send({
        title: "Debit transaction",
        amount: 2000,
        type: "debit",
      });

    const summaryResponse = await request(app.server)
      .get("/summary")
      .set("Cookie", cookies)
      .expect(200);

      expect(summaryResponse.body.summary).toEqual({
        amount: 3000,
      })
  });
});
