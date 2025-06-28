import express, { Request, Response, Router } from "express";
import DodoPayments from "dodopayments";
import { authenticateUser } from "../config/middleware";
import { subscriptionSchema } from "@repo/common";
import { CreateNewCustomer } from "dodopayments/src/resources.js";
import { Webhook } from "standardwebhooks";
import { CountryCode, Payment, Subscription } from "dodopayments/resources.mjs";

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

      res.status(200).json({ received: true });
    } catch (error) {
      console.error("Webhook verification failed:", error);
      res.status(400).json({ error: "Webhook verification failed" });
    }
  }
);
