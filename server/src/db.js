import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = Number(process.env.DB_PORT || 3306);
const DB_USER = process.env.DB_USER || 'root';
const DB_PASSWORD = process.env.DB_PASSWORD || '';
const DB_NAME = process.env.DB_NAME || 'startup_portal';

const ssl =
  process.env.DB_SSL_CA
    ? {
        ca: process.env.DB_SSL_CA,
        rejectUnauthorized: true
      }
    : undefined;

export const pool = mysql.createPool({
  host: DB_HOST,
  port: DB_PORT,
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME,
  ssl,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

export async function query(sql, params = []) {
  return pool.execute(sql, params).then(([rows]) => rows);
}

export async function testDatabase() {
  try {
    const connection = await pool.getConnection();

    console.log('====================================');
    console.log('✓ MySQL connection successful');
    console.log(`✓ Host: ${DB_HOST}`);
    console.log(`✓ User: ${DB_USER}`);
    console.log(`✓ Database: ${DB_NAME}`);
    console.log('====================================');

    connection.release();
    return true;
  } catch (error) {
    console.error('====================================');
    console.error('✗ MYSQL CONNECTION FAILED');
    console.error(error.message);
    console.error('====================================');

    return false;
  }
}