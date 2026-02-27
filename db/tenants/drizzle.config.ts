import type { Config } from "drizzle-kit";

export default {
  schema: "./db/tenants/schema.ts",
  out: "./db/tenants/migrations",
  dialect: "postgresql",
} satisfies Config;
