import type { Request, Response } from "express";
import { validated } from "../types.js";
import { createCheckoutSchema } from "../schemas/billing.schema.js";
import {
  createCheckoutSession,
  createPortalSession,
  getSubscription,
  constructWebhookEvent,
  handleWebhookEvent,
} from "../services/billing.service.js";

export const checkout = async (req: Request, res: Response) => {
  const {
    body: { plan },
    workspaceId,
  } = validated(req, createCheckoutSchema);

  const session = await createCheckoutSession(workspaceId, plan);
  res.json(session);
};

export const portal = async (req: Request, res: Response) => {
  const { workspaceId } = validated(req);
  const session = await createPortalSession(workspaceId);
  res.json(session);
};

export const subscription = async (req: Request, res: Response) => {
  const { workspaceId } = validated(req);
  const data = await getSubscription(workspaceId);
  res.json(data);
};

export const webhook = async (req: Request, res: Response) => {
  const signature = req.headers["stripe-signature"];
  if (!signature || typeof signature !== "string") {
    return res.status(400).json({ error: "Missing stripe-signature header" });
  }

  try {
    const event = await constructWebhookEvent(req.body, signature);
    await handleWebhookEvent(event);
    res.json({ received: true });
  } catch (err: any) {
    console.error("Stripe webhook error:", err.message);
    res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }
};
