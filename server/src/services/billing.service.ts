import Stripe from "stripe";
import { config } from "../config.js";
import { prisma } from "../db.js";
import { logger } from "../logger.js";

const stripe = new Stripe(config.STRIPE_SECRET_KEY);

const PLAN_PRICE_MAP: Record<string, string> = {
  pro: config.STRIPE_PRO_PRICE_ID,
  enterprise: config.STRIPE_ENTERPRISE_PRICE_ID,
};

const PRICE_PLAN_MAP: Record<string, "pro" | "enterprise"> = {
  [config.STRIPE_PRO_PRICE_ID]: "pro",
  [config.STRIPE_ENTERPRISE_PRICE_ID]: "enterprise",
};

const getSubscriptionPeriodEnd = (subscription: Stripe.Subscription): Date | null => {
  const item = subscription.items.data[0];
  if (item && "current_period_end" in item) {
    return new Date((item as any).current_period_end * 1000);
  }
  if (subscription.cancel_at) return new Date(subscription.cancel_at * 1000);
  return null;
};

const getOrCreateCustomer = async (workspaceId: string) => {
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    include: { members: { where: { role: "admin" }, include: { user: true }, take: 1 } },
  });

  if (!workspace) throw new Error("Workspace not found");

  if (workspace.stripe_customer_id) {
    return workspace.stripe_customer_id;
  }

  const adminUser = workspace.members[0]?.user;
  const customer = await stripe.customers.create({
    name: workspace.name,
    email: adminUser?.email,
    metadata: { workspace_id: workspaceId },
  });

  await prisma.workspace.update({
    where: { id: workspaceId },
    data: { stripe_customer_id: customer.id },
  });

  logger.info("Stripe customer created", { customerId: customer.id, workspaceId });
  return customer.id;
};

export const createCheckoutSession = async (workspaceId: string, plan: string) => {
  const priceId = PLAN_PRICE_MAP[plan];
  if (!priceId) throw new Error("Invalid plan");

  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: { _count: { select: { members: true } } },
  });
  if (!workspace) throw new Error("Workspace not found");

  const customerId = await getOrCreateCustomer(workspaceId);

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: priceId, quantity: workspace._count.members }],
    success_url: `${config.CLIENT_URL}/settings?tab=billing&status=success`,
    cancel_url: `${config.CLIENT_URL}/settings?tab=billing&status=canceled`,
    metadata: { workspace_id: workspaceId },
    subscription_data: {
      metadata: { workspace_id: workspaceId },
    },
  });

  logger.info("Checkout session created", { workspaceId, plan, members: workspace._count.members });
  return { url: session.url };
};

export const createPortalSession = async (workspaceId: string) => {
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: { stripe_customer_id: true },
  });

  if (!workspace?.stripe_customer_id) {
    throw new Error("No billing account found");
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: workspace.stripe_customer_id,
    return_url: `${config.CLIENT_URL}/settings?tab=billing`,
  });

  return { url: session.url };
};

export const getSubscription = async (workspaceId: string) => {
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: {
      plan: true,
      subscription_status: true,
      current_period_end: true,
      stripe_subscription_id: true,
      _count: { select: { members: true } },
    },
  });

  if (!workspace) throw new Error("Workspace not found");

  return {
    plan: workspace.plan,
    status: workspace.subscription_status,
    current_period_end: workspace.current_period_end?.toISOString() ?? null,
    member_count: workspace._count.members,
    has_subscription: !!workspace.stripe_subscription_id,
  };
};

export const syncSubscriptionSeats = async (workspaceId: string) => {
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: { stripe_subscription_id: true, _count: { select: { members: true } } },
  });
  if (!workspace?.stripe_subscription_id) return;

  try {
    const subscription = await stripe.subscriptions.retrieve(workspace.stripe_subscription_id);
    const item = subscription.items.data[0];
    if (!item) return;
    if (item.quantity === workspace._count.members) return;
    await stripe.subscriptionItems.update(item.id, {
      quantity: workspace._count.members,
      proration_behavior: "none",
    });
    logger.info("Synced subscription seats", {
      workspaceId,
      quantity: workspace._count.members,
    });
  } catch (err: any) {
    logger.error("Failed to sync subscription seats", { workspaceId, error: err?.message });
  }
};

export const handleWebhookEvent = async (event: Stripe.Event) => {
  const seen = await prisma.processedWebhookEvent.findUnique({ where: { id: event.id } });
  if (seen) {
    logger.info("Duplicate Stripe webhook ignored", { id: event.id, type: event.type });
    return;
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const workspaceId = session.metadata?.workspace_id;
      if (!workspaceId || !session.subscription) break;

      const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
      const priceId = subscription.items.data[0]?.price.id;
      const plan = priceId ? PRICE_PLAN_MAP[priceId] : undefined;

      if (plan) {
        await prisma.workspace.update({
          where: { id: workspaceId },
          data: {
            plan,
            stripe_subscription_id: subscription.id,
            subscription_status: subscription.status,
            current_period_end: getSubscriptionPeriodEnd(subscription),
          },
        });
        logger.info("Subscription activated", {
          workspaceId,
          plan,
          subscriptionId: subscription.id,
        });
      }
      break;
    }

    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      const workspaceId = subscription.metadata?.workspace_id;
      if (!workspaceId) break;

      const priceId = subscription.items.data[0]?.price.id;
      const plan = priceId ? PRICE_PLAN_MAP[priceId] : undefined;

      const periodEnd = subscription.cancel_at
        ? new Date(subscription.cancel_at * 1000)
        : getSubscriptionPeriodEnd(subscription);

      await prisma.workspace.update({
        where: { id: workspaceId },
        data: {
          ...(plan && { plan }),
          subscription_status: subscription.status,
          current_period_end: periodEnd,
        },
      });
      logger.info("Subscription updated", {
        workspaceId,
        status: subscription.status,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        plan,
      });
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const workspaceId = subscription.metadata?.workspace_id;
      if (!workspaceId) break;

      await prisma.workspace.update({
        where: { id: workspaceId },
        data: {
          plan: "free",
          subscription_status: "canceled",
          stripe_subscription_id: null,
          current_period_end: null,
        },
      });
      logger.info("Subscription deleted, reverted to free", { workspaceId });
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      const subscriptionId = (invoice.parent as any)?.subscription_details?.subscription as
        | string
        | undefined;
      if (!subscriptionId) break;

      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      const workspaceId = subscription.metadata?.workspace_id;
      if (!workspaceId) break;

      await prisma.workspace.update({
        where: { id: workspaceId },
        data: { subscription_status: "past_due" },
      });
      logger.warn("Invoice payment failed", { workspaceId, subscriptionId });
      break;
    }
  }

  try {
    await prisma.processedWebhookEvent.create({ data: { id: event.id } });
  } catch (err: any) {
    if (err?.code !== "P2002") throw err;
  }
};

export const constructWebhookEvent = async (payload: Buffer, signature: string) => {
  return stripe.webhooks.constructEventAsync(payload, signature, config.STRIPE_WEBHOOK_SECRET);
};
