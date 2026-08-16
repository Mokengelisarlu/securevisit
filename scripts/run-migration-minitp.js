#!/usr/bin/env node
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const postgres = require('postgres');

async function main() {
  const masterDbUrl = process.env.DATABASE_URL;
  if (!masterDbUrl) {
    console.error('Missing DATABASE_URL in environment');
    process.exit(1);
  }

  const masterSql = postgres(masterDbUrl, { ssl: 'require' });

  try {
    console.log('Querying master DB for tenant minitp...');
    const rows = await masterSql`select db_url from tenants where slug = 'minitp' limit 1`;
    if (!rows || rows.length === 0) {
      console.error('Tenant minitp not found in master DB');
      process.exit(1);
    }

    const tenantDbUrl = rows[0].db_url || rows[0].dbUrl;
    if (!tenantDbUrl) {
      console.error('Tenant has no db_url');
      process.exit(1);
    }

    console.log('Found tenant DB URL. Connecting...');
    const tenantSql = postgres(tenantDbUrl, { ssl: 'require' });

    const migrationPath = path.join(__dirname, '..', 'db', 'tenants', 'migrations', '0001_rename_divice_id_to_device_id.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    console.log('Running migration...');
    await tenantSql.begin(async (tx) => {
      // The migration uses DO $$ blocks; run as a single command
      await tx.unsafe(sql);
    });

    console.log('Migration applied successfully for minitp.');
    await tenantSql.end();
    await masterSql.end();
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    try { await masterSql.end(); } catch (_) {}
    process.exit(1);
  }
}

main();
