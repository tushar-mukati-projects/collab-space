import dotenv from "dotenv";
import { resolve } from "path";
import { defineConfig } from "prisma/config";

dotenv.config({ path: resolve(process.cwd(), "..", ".env") });

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
