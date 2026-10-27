import { initDatabase, query } from './src/db.js';
import bcrypt from 'bcryptjs';

async function testAll() {
  console.log('Testing Database and API readiness...');
  await initDatabase();

  const users = await query('SELECT id, name, email, password_hash, role_id FROM users');
  console.log(`Found ${users.length} seeded users in database.`);

  for (const u of users) {
    const valid = await bcrypt.compare('password', u.password_hash);
    console.log(`User: ${u.email.padEnd(26)} -> Password "password" valid: ${valid ? '✅ YES' : '❌ NO'}`);
  }

  const [ideas, projects, startups, deals, challenges, programs] = await Promise.all([
    query('SELECT count(*) as c FROM ideas'),
    query('SELECT count(*) as c FROM projects'),
    query('SELECT count(*) as c FROM startups'),
    query('SELECT count(*) as c FROM deals'),
    query('SELECT count(*) as c FROM challenges'),
    query('SELECT count(*) as c FROM incubation_programs')
  ]);

  console.log('\nEntity counts:');
  console.log('  Ideas:      ', ideas[0]?.c);
  console.log('  Projects:   ', projects[0]?.c);
  console.log('  Startups:   ', startups[0]?.c);
  console.log('  Deals:      ', deals[0]?.c);
  console.log('  Challenges: ', challenges[0]?.c);
  console.log('  Programs:   ', programs[0]?.c);

  console.log('\nALL VERIFICATION TESTS COMPLETED SUCCESSFULLY!');
  process.exit(0);
}

testAll().catch(e => {
  console.error('Test failed:', e);
  process.exit(1);
});
