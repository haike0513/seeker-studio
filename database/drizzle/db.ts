import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema/index";

// PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Export the database instance with schema
export const db = drizzle(pool, {
  schema,
  logger: process.env.DB_LOGGER === "true" ? true : false, // Enable SQL query logging
});
