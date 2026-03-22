import "dotenv/config";

export const config = {
  PORT: Number(process.env.PORT ?? 4000),
  CLIENT_URL: process.env.CLIENT_URL ?? "http://localhost:3000",
  DATABASE_URL: process.env.DATABASE_URL!,
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY!,
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET!,
  STRIPE_PRO_PRICE_ID: process.env.STRIPE_PRO_PRICE_ID!,
  STRIPE_ENTERPRISE_PRICE_ID: process.env.STRIPE_ENTERPRISE_PRICE_ID!,
};
