"use server";

import { runTenantMigrations } from "@/db/tenants/migrate";
import { createApiClient } from "@neondatabase/api-client";

const apiClient = createApiClient({
  apiKey: process.env.NEON_API_KEY!,
});

// Read from .env automatically
const PROJECT_ID = process.env.NEON_PROJECT_ID!;
const BRANCH_ID = process.env.NEON_BRANCH_ID!;

/**
 * Generate a database name based on tenant slug
 */
function generateTenantDbName(slug: string) {
  return `tenant_${slug.replace(/-/g, "_")}`;
}

/**
 * Create a Neon database for a tenant and return a dynamic connection URL
 */
export async function createTenantDatabase(slug: string, ownerName: string) {
  const dbName = generateTenantDbName(slug);

  try {
    // 1️⃣ Create the database in Neon
    try {
      await apiClient.createProjectBranchDatabase(PROJECT_ID, BRANCH_ID, {
        database: { name: dbName, owner_name: "neondb_owner" },
      });
      console.log("Database created successfully:", dbName);
    } catch (error: any) {
      // 409 Conflict means the database already exists
      if (error.response?.status === 409) {
        console.log("Database already exists, skipping creation:", dbName);
      } else {
        console.error("Failed to create database:", error.message || error);
        throw error;
      }
    }

    // 2️⃣ Fetch a dynamic connection URI for the new database
    const uriResponse = await apiClient.getConnectionUri({
      projectId: PROJECT_ID,
      branch_id: BRANCH_ID,
      database_name: dbName, // Use our generated name
      role_name: "neondb_owner"
    });
    const dbUrl = uriResponse.data.uri;

    if (!dbUrl) throw new Error("Failed to fetch connection URI from Neon API");

    console.log("Tenant DB URL:", dbUrl);

    // 3️⃣ Optional: run tenant migrations here
    await runTenantMigrations(dbUrl);

    return dbUrl; // Return full dynamic connection URL
  } catch (error: any) {
    console.error("Error creating tenant database:", error.message || error);
    throw error;
  }
}

// Example usage
// createTenantDatabase("my-tenant", "neon_owner").then(console.log).catch(console.error);
