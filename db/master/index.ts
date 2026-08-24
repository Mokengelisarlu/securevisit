import { neon, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

// Neon over HTTP fetch can hit transient network failures (this machine has no
// working IPv6 route while Neon publishes AAAA records). Retry briefly before
// giving up instead of failing the whole render.
neonConfig.fetchFunction = async (url: unknown, options: unknown) => {
  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await fetch(url as Parameters<typeof fetch>[0], options as RequestInit);
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, 200 * 2 ** attempt));
    }
  }
  throw lastError;
};

const sql = neon(process.env.DATABASE_URL!);

export const master_db = drizzle(sql, {
  schema, 
});
