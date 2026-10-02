process.env.DATABASE_URL = 'file:./dev.db';
import { writeJson, readJson } from '../src/lib/storage';

async function run() {
  await writeJson('test.json', { hello: 'world', time: Date.now() });
  const data = await readJson('test.json', null);
  console.log('read from storage:', data);
}

run().catch((e) => { console.error(e); process.exit(1); });
