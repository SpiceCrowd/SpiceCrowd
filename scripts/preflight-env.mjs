import fs from 'node:fs';
import path from 'node:path';

const projectRoot = process.cwd();
const envExamplePath = path.join(projectRoot, '.env.example');

const requiredKeys = [
  'DATABASE_URL',
  'JWT_SECRET',
  'RAZORPAY_KEY_ID',
  'RAZORPAY_KEY_SECRET',
  'EMAIL_PROVIDER_API_KEY',
  'NEXT_PUBLIC_MAP_URL',
];

function parseEnvExample(text) {
  const keys = [];
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const idx = line.indexOf('=');
    if (idx <= 0) continue;
    const key = line.slice(0, idx).trim();
    if (key) keys.push(key);
  }
  return keys;
}

function maskValue(value) {
  if (!value) return '(missing)';
  if (value.length <= 6) return '***';
  return `${value.slice(0, 2)}***${value.slice(-2)}`;
}

if (!fs.existsSync(envExamplePath)) {
  console.error('preflight: .env.example not found');
  process.exit(1);
}

const envExampleText = fs.readFileSync(envExamplePath, 'utf8');
const exampleKeys = parseEnvExample(envExampleText);
const missingFromExample = requiredKeys.filter((key) => !exampleKeys.includes(key));

if (missingFromExample.length > 0) {
  console.error('preflight: missing required keys in .env.example:', missingFromExample.join(', '));
  process.exit(1);
}

const missingInEnvironment = requiredKeys.filter((key) => !process.env[key]);

if (missingInEnvironment.length > 0) {
  console.warn('preflight: missing environment values for deployment:');
  for (const key of missingInEnvironment) {
    console.warn(`- ${key}`);
  }
  console.warn('preflight: set these in deployment secrets before release.');
  process.exit(2);
}

console.log('preflight: all required environment keys are present.');
for (const key of requiredKeys) {
  console.log(`- ${key}=${maskValue(process.env[key])}`);
}
