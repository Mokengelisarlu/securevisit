import 'dotenv/config';
import type { Config } from "drizzle-kit";

export default {
  schema: "./db/tenants/schema.ts",
  out: "./db/tenants/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
} satisfies Config;
