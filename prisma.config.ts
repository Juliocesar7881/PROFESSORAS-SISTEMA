import { existsSync } from "node:fs";
import path from "node:path";
import { config as loadEnv } from "dotenv";
import { defineConfig } from "prisma/config";

const envLocalPath = path.resolve(process.cwd(), ".env.local");
const envPath = path.resolve(process.cwd(), ".env");

if (existsSync(envLocalPath)) {
  loadEnv({ path: envLocalPath });
} else {
  loadEnv({ path: envPath });
}

const fallbackDatabaseUrl = "postgresql://postgres:postgres@localhost:5432/postgres";

function getMigrationDatabaseUrl() {
  const directUrl = process.env.DIRECT_URL?.trim();

  if (directUrl && !directUrl.includes(".pooler.supabase.com")) {
    return directUrl;
  }

  const databaseUrl = process.env.DATABASE_URL?.trim();

  if (!databaseUrl) {
    return directUrl || fallbackDatabaseUrl;
  }

  try {
    const parsedDatabaseUrl = new URL(databaseUrl);
    const supabaseUrl = process.env.SUPABASE_URL?.trim();

    if (parsedDatabaseUrl.hostname.includes(".pooler.supabase.com") && supabaseUrl) {
      const projectRef = new URL(supabaseUrl).hostname.replace(".supabase.co", "");
      parsedDatabaseUrl.hostname = `db.${projectRef}.supabase.co`;
      parsedDatabaseUrl.port = "5432";
      parsedDatabaseUrl.username = parsedDatabaseUrl.username.split(".")[0];
      return parsedDatabaseUrl.toString();
    }
  } catch {
    return directUrl || databaseUrl;
  }

  return directUrl || databaseUrl;
}

const migrationDatabaseUrl = getMigrationDatabaseUrl();

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: migrationDatabaseUrl,
  },
});
