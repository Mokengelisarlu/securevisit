import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
    out: './db/tenants/migrations',
    schema: './db/tenants/schema.ts',
    dialect: 'postgresql',
});
