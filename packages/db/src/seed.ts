import { seedSystem } from './seeds/system.seed';

async function run() {
  await seedSystem();
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});