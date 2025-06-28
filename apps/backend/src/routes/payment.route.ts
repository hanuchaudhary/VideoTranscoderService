import { CountryCode, Payment, Subscription } from "dodopayments/resources.mjs";
import { subscription, transaction } from "@repo/database/schema";
import { CreateNewCustomer } from "dodopayments/src/resources.js";
import express, { Request, Response, Router } from "express";
import { authenticateUser } from "../config/middleware";
import { subscriptionSchema } from "@repo/common";
import { Webhook } from "standardwebhooks";
import { db } from "@repo/database/client";
import DodoPayments from "dodopayments";
import { v4 as uuid } from "uuid";
import { eq } from "drizzle-orm";

const client = new DodoPayments({
  bearerToken: process.env["DODO_PAYMENTS_API_KEY"],
});

const ENVS = [
  "DODO_PAYMENTS_API_KEY",
  "DODO_PAYMENTS_PRODUCT_ID",
  "DODO_PAYMENTS_WEBHOOK_SECRET",
];

for (const env of ENVS) {
  if (!process.env[env]) {
    console.error(`Missing environment variable: ${env}`);
    break;
  }
}

export const paymentRouter = express.Router() as Router;

paymentRouter.post(
  "/create-subscription",
  authenticateUser,
  async (req: Request, res: Response) => {
    console.log("Received request to create subscription", req.body);
    const payload = subscriptionSchema.safeParse(req.body);
    console.log("Received subscription request:", payload);

    if (!payload.success) {
      res.status(400).json({
        error: "Invalid request data",
        details: payload.error.errors,
      });
      return;
    }

    const { data } = payload;

    try {
      const subscription = await client.subscriptions.create({
        billing: {
          city: data.city,
          country: data.country as CountryCode,
          state: data.state,
          street: data.street,
          zipcode: data.zipcode,
        },
        customer: {
          create_new_customer: true,
          email: req.user.email,
          customer_id: req.user.id,
          name: req.user.name,
        } as CreateNewCustomer,
        product_id: process.env["DODO_PAYMENTS_PRODUCT_ID"]!,
        payment_link: true,
        return_url: "https://localhost:3000/subscription/success",
        quantity: 1,
      });

      console.log(subscription.subscription_id);
      res.status(200).json({
        subscriptionId: subscription.subscription_id,
        paymentLink: subscription.payment_link,
      });
    } catch (error) {
      console.error("Error creating subscription:", error);
      res.status(500).json({ error: "Failed to create subscription" });
    }
  }
);

type WebhookPayload = {
  type: string;
  data: Payment | Subscription;
};

paymentRouter.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  async (req: Request, res: Response) => {
    const webhook = new Webhook(process.env["DODO_PAYMENTS_WEBHOOK_SECRET"]!);

    const webhookHeaders = {
      "webhook-id": (req.headers["webhook-id"] as string) || "",
      "webhook-signature": (req.headers["webhook-signature"] as string) || "",
      "webhook-timestamp": (req.headers["webhook-timestamp"] as string) || "",
    };

    try {
      await webhook.verify(req.body.toString(), webhookHeaders);
      const payload = JSON.parse(req.body.toString()) as WebhookPayload;
      console.log(
        "Webhook payload:",
        payload.data.status == "active"
          ? "Subscription activated"
          : "Payment received"
      );

      if (!payload.data?.customer?.email) {
        throw new Error("Missing customer email in payload");
      }

      const userEmail = payload.data.customer.email;

      switch (payload.data.status) {
        case "active":
          await db.transaction(async (tx) => {
            await tx.insert(subscription).values({
              id: uuid(),
              userId: payload.data.customer.customer_id!,
              status: "ACTIVE",
              startDate: new Date(),
              endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
              nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            });

            await tx.insert(transaction).values({
              id: uuid(),
              userId: payload.data.customer.customer_id!,
              amount: "4.99", // Assuming a fixed amount for simplicity
              currency: payload.data.currency,
              status: "ACTIVE",
              planId: payload.data.subscription_id || "",
              metadata: payload.data.metadata || {},
              paymentMethod: payload.data.metadata?.payment_method || "card",
            });
          });
          console.log(`Subscription activated for user: ${userEmail}`);
          break;

        case "expired":
          await db.transaction(async (tx) => {
            await tx
              .update(subscription)
              .set({ status: "EXPIRED" })
              .where(
                eq(subscription.userId, payload.data.customer.customer_id!)
              );
          });
          console.log(`Subscription expired for user: ${userEmail}`);
          break;

        case "failed":
          await db.insert(transaction).values({
            id: uuid(),
            userId: payload.data.customer.customer_id!,
            amount: "0",
            currency: payload.data.currency,
            planId: payload.data.subscription_id || "",
            status: "FAILED",
            paymentMethod: payload.data.metadata?.payment_method || "card",
          });
          console.log(`Payment failed for user: ${userEmail}`);
          break;

        case "cancelled":
          await db.transaction(async (tx) => {
            await tx
              .update(subscription)
              .set({ status: "CANCELLED" })
              .where(
                eq(subscription.userId, payload.data.customer.customer_id!)
              );
          });
          console.log(`Subscription cancelled for user: ${userEmail}`);
          break;

        case "succeeded":
          await db.insert(transaction).values({
            id: uuid(),
            userId: payload.data.customer.customer_id!,
            amount: "0",
            currency: payload.data.currency,
            status: "SUCCEEDED",
            planId: payload.data.subscription_id || "",
            metadata: payload.data.metadata || {},
            paymentMethod: payload.data.metadata?.payment_method || "card",
          });
          console.log(`Payment succeeded for user: ${userEmail}`);
          break;

        default:
          console.log(
            `Unhandled status: ${payload.data.status} for user: ${userEmail}`
          );
          break;
      }

      res.status(200).json({ received: true });
    } catch (error) {
      console.error("Webhook verification failed:", error);
      res.status(400).json({ error: "Webhook verification failed" });
    }
  }
);

// Get user's transactions
paymentRouter.get(
  "/transactions",
  authenticateUser,
  async (req: Request, res: Response) => {
    try {
      const userTransactions = await db
        .select()
        .from(transaction)
        .where(eq(transaction.userId, req.user.id));

      res.status(200).json({
        transactions: userTransactions,
      });
    } catch (error) {
      console.error("Error fetching transactions:", error);
      res.status(500).json({ error: "Failed to fetch transactions" });
    }
  }
);

// Get user's active subscription
paymentRouter.get(
  "/subscription",
  authenticateUser,
  async (req: Request, res: Response) => {
    try {
      const activeSubscription = await db
        .select()
        .from(subscription)
        .where(eq(subscription.userId, req.user.id))
        .limit(1);

      if (activeSubscription.length === 0) {
        res.status(404).json({ error: "No subscription found" });
        return;
      }

      res.status(200).json({
        subscription: activeSubscription[0],
      });
    } catch (error) {
      console.error("Error fetching subscription:", error);
      res.status(500).json({ error: "Failed to fetch subscription" });
    }
  }
);
