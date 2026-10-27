import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function run() {
  const host = process.env.DB_HOST || 'localhost';
  const port = Number(process.env.DB_PORT || 3306);
  const user = process.env.DB_USER || 'root';
  // Allow password passed as CLI argument, e.g. node src/init-db.js mypassword
  const password = process.argv[2] !== undefined ? process.argv[2] : (process.env.DB_PASSWORD || '');
  const database = process.env.DB_NAME || 'startup_portal';

  console.log('--------------------------------------------------');
  console.log('Startup & Innovation Portal — MySQL Database Setup');
  console.log(`Connecting to MySQL at ${host}:${port} as ${user}...`);
  console.log('--------------------------------------------------');

  try {
    const conn = await mysql.createConnection({
      host,
      port,
      user,
      password,
      multipleStatements: true
    });

    console.log('[1/3] Connected to MySQL Server successfully.');

    const schemaPath = path.join(__dirname, '../../database/schema.sql');
    const seedPath = path.join(__dirname, '../../database/seed.sql');

    if (!fs.existsSync(schemaPath) || !fs.existsSync(seedPath)) {
      throw new Error(`Schema or seed file missing in ../../database/`);
    }

    console.log('[2/3] Executing database/schema.sql...');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    await conn.query(schemaSql);
    console.log(`      Created database "${database}" and all 25 relational tables.`);

    console.log('[3/3] Executing database/seed.sql...');
    const seedSql = fs.readFileSync(seedPath, 'utf8');
    await conn.query(seedSql);
    console.log('      Populated demo accounts, startups, projects, and deals.');

    await conn.end();

    // Update server/.env with this password if provided
    const envPath = path.join(__dirname, '../.env');
    let envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
    if (!envContent) {
      envContent = `PORT=5000\nDB_HOST=${host}\nDB_PORT=${port}\nDB_USER=${user}\nDB_PASSWORD=${password}\nDB_NAME=${database}\nJWT_SECRET=startup-portal-secret-key-2026\nCLIENT_URL=http://localhost:5173\n`;
      fs.writeFileSync(envPath, envContent, 'utf8');
    } else {
      envContent = envContent.replace(/DB_PASSWORD=.*/g, `DB_PASSWORD=${password}`);
      fs.writeFileSync(envPath, envContent, 'utf8');
    }

    console.log('--------------------------------------------------');
    console.log('SUCCESS: MySQL Database initialized!');
    console.log(`Database "${database}" is ready for MySQL Workbench and the portal.`);
    console.log('--------------------------------------------------');
    process.exit(0);
  } catch (err) {
    console.error('\nERROR: Failed to initialize MySQL database:');
    console.error(err.message);
    console.log('\nTip: You can pass your MySQL password directly:');
    console.log('  node src/init-db.js <your_mysql_password>');
    console.log('Or open MySQL Workbench, run database/schema.sql and database/seed.sql directly.');
    process.exit(1);
  }
}

run();
