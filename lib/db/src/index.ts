import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

// DATABASE_URL is validated at server startup (api-server/src/index.ts).
// Not throwing here allows the server to start and serve /api/healthz
// even before the database is provisioned. All DB queries will fail
// with a pg connection error if DATABASE_URL is absent.
export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool, { schema });

export * from "./schema";
