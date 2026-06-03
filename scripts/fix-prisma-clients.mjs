/**
 * Fix Prisma client isolation in monorepo - each service gets its own generated client
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const services = [
  'auth-service',
  'asset-service',
  'service-request-service',
  'notification-service',
  'reporting-service',
];

const GENERATED_IMPORT = '../generated/prisma/index.js';
const SEED_IMPORT = '../src/generated/prisma/index.js';

function walk(dir, files = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (entry === 'node_modules' || entry === 'dist' || entry === 'generated') continue;
    if (statSync(full).isDirectory()) walk(full, files);
    else if (/\.(ts|tsx)$/.test(entry)) files.push(full);
  }
  return files;
}

for (const service of services) {
  const serviceDir = join(root, 'services', service);
  const schemaPath = join(serviceDir, 'prisma', 'schema.prisma');

  let schema = readFileSync(schemaPath, 'utf8');
  if (!schema.includes('output')) {
    schema = schema.replace(
      /generator client \{\s*\n\s*provider = "prisma-client-js"\s*\n\}/,
      `generator client {\n  provider = "prisma-client-js"\n  output   = "../src/generated/prisma"\n}`
    );
    writeFileSync(schemaPath, schema);
    console.log(`Updated schema: ${service}`);
  }

  const clientPath = join(serviceDir, 'src', 'prisma', 'client.ts');
  if (readFileSync(clientPath, 'utf8').includes("@prisma/client")) {
    writeFileSync(
      clientPath,
      `import { PrismaClient } from '${GENERATED_IMPORT}';\n\nconst globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };\n\nexport const prisma =\n  globalForPrisma.prisma ??\n  new PrismaClient({\n    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],\n  });\n\nif (process.env.NODE_ENV !== 'production') {\n  globalForPrisma.prisma = prisma;\n}\n\nexport * from '${GENERATED_IMPORT}';\n`
    );
    console.log(`Updated client: ${service}`);
  }

  const files = walk(serviceDir);
  for (const file of files) {
    if (file.includes('generated/prisma')) continue;
    let content = readFileSync(file, 'utf8');
    if (!content.includes("@prisma/client")) continue;

    const isSeed = file.includes('prisma\\seed.ts') || file.includes('prisma/seed.ts');
    const replacement = isSeed ? SEED_IMPORT : GENERATED_IMPORT;
    const updated = content.replace(/from '@prisma\/client'/g, `from '${replacement}'`);
    if (updated !== content) {
      writeFileSync(file, updated);
      console.log(`Fixed import: ${file.replace(root, '')}`);
    }
  }

  console.log(`Generating Prisma client for ${service}...`);
  execSync('npx prisma generate', { cwd: serviceDir, stdio: 'inherit' });
}

console.log('Done!');
