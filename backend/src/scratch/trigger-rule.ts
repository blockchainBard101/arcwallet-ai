import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

async function main() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  const parsedConditions = {
    trigger: {
      type: 'balance',
      token: 'USDC',
      operator: 'below',
      value: 15.0 // Set threshold to 15.0 so that current balance of 10.0 triggers it!
    },
    action: {
      type: 'transfer',
      amount: 1.0,
      to: '0x0Da9DB8b9164C0EdaFFB1007813619f702486036'
    }
  };

  await pool.query(
    `UPDATE rules 
     SET parsed_conditions = $1, status = 'active' 
     WHERE id LIKE 'test-rule-id-%'`,
    [JSON.stringify(parsedConditions)]
  );

  console.log('Successfully updated test rule to trigger conditions.');
  await pool.end();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
