import "dotenv/config";

export const config = {
  PORT: Number(process.env.PORT ?? 4000),
  CLIENT_URL: process.env.CLIENT_URL ?? "http://localhost:3000",
  DATABASE_URL: process.env.DATABASE_URL!,
  COLLAB_PORT: Number(process.env.COLLAB_PORT ?? 1234),
};
