import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";

import { databaseConfig } from "../config/database.config.js";

const { Pool } = pg;

export const pool = new Pool({
  host: databaseConfig.host,
  port: databaseConfig.port,
  database: databaseConfig.database,
  user: databaseConfig.user,
  password: databaseConfig.password,
  ssl: databaseConfig.ssl ? { rejectUnauthorized: false } : false,
});

export const db = drizzle(pool);

export async function testDatabaseConnection(): Promise<void> {
  const client = await pool.connect();

  try {
    await client.query("SELECT 1");
  } finally {
    client.release();
  }
}
