import { seedSystem } from './seeds/system.seed';
import { seedCompensation } from './seeds/compensation.seed';
import { seedPayroll } from './seeds/payroll.seed';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool);

async function run() {
  await seedCompensation(db);
  await seedSystem();
  await seedPayroll(db);
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});