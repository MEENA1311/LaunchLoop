import { query } from './src/db.js';
import bcrypt from 'bcryptjs';

async function run() {
  const hash = await bcrypt.hash('password', 10);
  console.log('Generated fresh hash for "password":', hash);
  await query('UPDATE users SET password_hash = ?', [hash]);
  console.log('Successfully updated all users in DB.');

  const test = await query('SELECT email, password_hash FROM users');
  for (const u of test) {
    const ok = await bcrypt.compare('password', u.password_hash);
    console.log(u.email.padEnd(25), ok ? '✅ OK' : '❌ FAIL');
  }
  process.exit(0);
}

run().catch(console.error);
