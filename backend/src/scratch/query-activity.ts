import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

async function main() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  const res = await pool.query(
    'SELECT id, agent_id, action_type, status, tx_hash, created_at FROM activity_logs ORDER BY created_at DESC'
  );
  console.log('All Logs:', JSON.stringify(res.rows, null, 2));

  await pool.end();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
