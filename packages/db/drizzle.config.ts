import { config } from 'dotenv';
import path from 'path';
import type { Config } from 'drizzle-kit';

config({
  path: path.resolve(__dirname, '../../.env'),
});

export default {
  schema: './src/schema/index.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  strict: true,
  verbose: true,
} satisfies Config;