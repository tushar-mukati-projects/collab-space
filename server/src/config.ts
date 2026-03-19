import "dotenv/config";

export const config = {
  PORT: Number(process.env.PORT ?? 4000),
  CLIENT_URL: process.env.CLIENT_URL ?? "http://localhost:3000",
  DATABASE_URL: process.env.DATABASE_URL!,
};
