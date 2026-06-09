import postgres from 'postgres';

const MASTER_DB_URL = 'postgresql://neondb_owner:npg_LSkXdMv2fC0z@ep-old-wave-ah4msy98-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require';

async function main() {
  const masterSql = postgres(MASTER_DB_URL);
  try {
    const [tenant] = await masterSql`SELECT name, slug, db_url FROM tenants WHERE slug = 'acmecorp'`;
    if (!tenant) {
      console.error('acmecorp tenant not found in master db');
      return;
    }
    console.log('Tenant database URL:', tenant.db_url);

    const tenantSql = postgres(tenant.db_url);
    try {
      // List tables
      const tables = await tenantSql`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
      `;
      console.log('TABLES IN TENANT DB:', tables.map(t => t.table_name));

      // Check columns of devices table if it exists
      if (tables.some(t => t.table_name === 'devices')) {
        const columns = await tenantSql`
          SELECT column_name, data_type, is_nullable
          FROM information_schema.columns
          WHERE table_name = 'devices'
        `;
        console.log('COLUMNS IN DEVICES TABLE:');
        console.log(JSON.stringify(columns, null, 2));
      } else {
        console.log('WARNING: devices table does NOT exist in tenant database!');
      }
    } catch (err) {
      console.error('Error querying tenant db:', err);
    } finally {
      await tenantSql.end();
    }
  } catch (error) {
    console.error('Error querying master db:', error);
  } finally {
    await masterSql.end();
  }
}

main();
