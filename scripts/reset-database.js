#!/usr/bin/env node

const { spawnSync } = require('node:child_process');
const { existsSync } = require('node:fs');
const path = require('node:path');
const dotenv = require('dotenv');

const target = process.argv[2];
const skipSeed = process.argv.includes('--skip-seed');
const allowRemoteLive = process.argv.includes('--allow-remote-live');

const configs = {
  dev: {
    database: 'dev_db',
    envFiles: ['.env.local', '.env'],
    fallbackUrl: 'mysql://root@localhost:3306/dev_db',
  },
  live: {
    database: 'live_db',
    envFiles: ['.env.production'],
    fallbackUrl: 'mysql://root@localhost:3306/live_db',
  },
};

if (!target || !configs[target]) {
  console.error('Usage: node scripts/reset-database.js <dev|live> [--skip-seed] [--allow-remote-live]');
  process.exit(1);
}

const config = configs[target];
for (const envFile of config.envFiles) {
  const envPath = path.resolve(process.cwd(), envFile);
  if (existsSync(envPath)) {
    dotenv.config({ path: envPath });
  }
}

const databaseUrl =
  target === 'live'
    ? process.env.LIVE_DATABASE_URL || process.env.DATABASE_URL || config.fallbackUrl
    : process.env.DATABASE_URL || config.fallbackUrl;

let parsedUrl;
try {
  parsedUrl = new URL(databaseUrl);
} catch {
  console.error(`Invalid DATABASE_URL for ${target}.`);
  process.exit(1);
}

const databaseName = parsedUrl.pathname.replace(/^\//, '');
if (databaseName !== config.database) {
  console.error(`Refusing to reset "${databaseName}". Expected "${config.database}" for ${target}.`);
  process.exit(1);
}

const localHosts = new Set(['localhost', '127.0.0.1', '::1']);
if (target === 'live' && !localHosts.has(parsedUrl.hostname) && !allowRemoteLive) {
  console.error('Refusing to reset a remote live database without --allow-remote-live.');
  process.exit(1);
}

const args = ['prisma', 'migrate', 'reset', '--force'];
if (skipSeed) {
  args.push('--skip-seed');
}

console.log(`Resetting ${target} database "${databaseName}" on ${parsedUrl.hostname}...`);
const result = spawnSync(process.platform === 'win32' ? 'npx.cmd' : 'npx', args, {
  env: { ...process.env, DATABASE_URL: databaseUrl },
  shell: process.platform === 'win32',
  stdio: 'inherit',
});

process.exit(result.status ?? 1);
