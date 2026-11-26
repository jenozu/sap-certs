import { defineConfig } from 'drizzle-kit';
export default defineConfig({ dialect: 'postgresql', schema: './db/postgres/schema.ts', out: './drizzle-postgres/generated' });
