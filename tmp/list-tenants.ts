import postgres from 'postgres';

const DATABASE_URL = 'postgresql://neondb_owner:npg_LSkXdMv2fC0z@ep-old-wave-ah4msy98-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require';

const sql = postgres(DATABASE_URL);

async function main() {
  try {
    const rows = await sql`SELECT name, slug FROM tenants`;
    console.log('ACTIVE TENANTS IN DATABASE:');
    console.log(JSON.stringify(rows, null, 2));
  } catch (error) {
    console.error('Error querying database:', error);
  } finally {
    await sql.end();
  }
}

main();
