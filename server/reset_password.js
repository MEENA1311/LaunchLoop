import dotenv from 'dotenv';
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';

dotenv.config();

const accounts = [
  'student@startup.local',
  'mentor@startup.local',
  'startup@startup.local',
  'investor@startup.local',
  'incubator@startup.local',
  'admin@startup.local'
];

const password = 'password';

async function resetPasswords() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'startup_portal'
  });

  try {
    const hash = await bcrypt.hash(password, 10);

    for (const email of accounts) {
      const [result] = await connection.execute(
        `UPDATE users
         SET password_hash = ?
         WHERE email = ?`,
        [hash, email]
      );

      if (result.affectedRows === 1) {
        const [rows] = await connection.execute(
          `SELECT password_hash
           FROM users
           WHERE email = ?`,
          [email]
        );

        const valid = await bcrypt.compare(
          password,
          rows[0].password_hash
        );

        console.log(
          `${valid ? '✓' : '✗'} ${email}`
        );
      } else {
        console.log(`✗ NOT FOUND: ${email}`);
      }
    }

    console.log('');
    console.log('======================================');
    console.log(' All review passwords have been reset');
    console.log('======================================');
    console.log('Password for every account: password');
    console.log('');

  } finally {
    await connection.end();
  }
}

resetPasswords().catch(error => {
  console.error('Password reset failed:');
  console.error(error);
  process.exit(1);
});