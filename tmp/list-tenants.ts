import "dotenv/config";
import { master_db } from "../db/master";
import { tenants } from "../db/master/schema";

async function main() {
  const allTenants = await master_db.select().from(tenants);
  console.log(JSON.stringify(allTenants, null, 2));
}

main().catch(console.error);
