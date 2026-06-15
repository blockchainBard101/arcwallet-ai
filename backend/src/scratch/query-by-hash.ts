import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

async function main() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  const res = await pool.query(
    `SELECT id, agent_id, action_type, status, tx_hash, payload, created_at 
     FROM activity_logs 
     WHERE tx_hash LIKE '%0x66f4%' OR payload::text LIKE '%0x66f4%'`
  );
  console.log('Logs matching tx:', JSON.stringify(res.rows, null, 2));

  await pool.end();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
