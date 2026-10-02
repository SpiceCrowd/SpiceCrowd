import fs from 'node:fs';
import path from 'node:path';

const projectRoot = process.cwd();
const envLocalPath = path.join(projectRoot, '.env.local');

const requiredKeys = [
  'DATABASE_URL',
  'JWT_SECRET',
  'RAZORPAY_KEY_ID',
  'RAZORPAY_KEY_SECRET',
  'EMAIL_PROVIDER_API_KEY',
  'NEXT_PUBLIC_MAP_URL',
];

const placeholderFragments = [
  'replace_with',
  'your_',
  '...'
];

function parseEnvFile(text) {
  const map = new Map();
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const idx = line.indexOf('=');
    if (idx <= 0) continue;
    const key = line.slice(0, idx).trim();
    let value = line.slice(idx + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    map.set(key, value);
  }
  return map;
}

function isPlaceholder(value) {
  const normalized = String(value || '').toLowerCase();
  return placeholderFragments.some((fragment) => normalized.includes(fragment));
}

if (!fs.existsSync(envLocalPath)) {
  console.error('preflight: .env.local not found');
  console.error('preflight: create it from .env.local.example first.');
  process.exit(1);
}

const envLocalText = fs.readFileSync(envLocalPath, 'utf8');
const envValues = parseEnvFile(envLocalText);

const missing = [];
const placeholders = [];
for (const key of requiredKeys) {
  const value = envValues.get(key);
  if (!value) {
    missing.push(key);
  } else if (isPlaceholder(value)) {
    placeholders.push(key);
  }
}

if (missing.length > 0) {
  console.error('preflight: missing required keys in .env.local:');
  for (const key of missing) {
    console.error(`- ${key}`);
  }
}

if (placeholders.length > 0) {
  console.error('preflight: placeholder values detected in .env.local:');
  for (const key of placeholders) {
    console.error(`- ${key}`);
  }
}

if (missing.length > 0 || placeholders.length > 0) {
  console.error('preflight: update .env.local with real values and run again.');
  process.exit(1);
}

console.log('preflight: .env.local contains all required keys with non-placeholder values.');
