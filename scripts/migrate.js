import pg from "pg";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbUser = process.env.DB_USER ?? "postgres";
const sql = readFileSync(join(__dirname, "../db_is_seguridad.sql"), "utf8")
  .replace(/OWNER TO \w+/g, `OWNER TO ${dbUser}`);

const pool = new pg.Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
});

try {
  await pool.query(sql);
  console.log("Migración completada exitosamente.");
} finally {
  await pool.end();
}
