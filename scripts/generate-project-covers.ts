import { access } from "node:fs/promises";
import path from "node:path";

import { PROJECT_CATALOG } from "@/lib/project-catalog";
import { getProjectCoverKey } from "@/lib/project-cover";

const OUTPUT_DIR = path.join(process.cwd(), "public", "projects", "covers");

async function main() {
  const missing: string[] = [];

  for (const project of PROJECT_CATALOG) {
    const key = getProjectCoverKey(project.titulo, project.categoria);
    const outputPath = path.join(OUTPUT_DIR, `${key}.webp`);

    try {
      await access(outputPath);
    } catch {
      missing.push(`${key}.webp`);
    }
  }

  if (missing.length) {
    throw new Error(`Missing project covers: ${missing.join(", ")}`);
  }

  console.log(`Verified ${PROJECT_CATALOG.length} AI-generated project covers in ${path.relative(process.cwd(), OUTPUT_DIR)}.`);
}

void main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
