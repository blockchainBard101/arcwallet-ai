import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

async function main() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  // Fetch the agent ID
  const agentRes = await pool.query('SELECT id FROM agents LIMIT 1');
  if (agentRes.rows.length === 0) {
    console.error('No agent found in database.');
    await pool.end();
    return;
  }
  const agentId = agentRes.rows[0].id;
  console.log('Using Agent ID:', agentId);

  // Generate a random ID for the rule
  const ruleId = 'test-rule-id-' + Math.random().toString(36).substring(7);

  const naturalRuleText = 'If USDC balance drops below 2 USDC, transfer 1 USDC to 0x0Da9DB8b9164C0EdaFFB1007813619f702486036';
  const parsedConditions = {
    trigger: {
      type: 'balance',
      token: 'USDC',
      operator: 'below',
      value: 2.0
    },
    action: {
      type: 'transfer',
      amount: 1.0,
      to: '0x0Da9DB8b9164C0EdaFFB1007813619f702486036'
    }
  };

  await pool.query(
    'INSERT INTO rules (id, agent_id, natural_rule_text, parsed_conditions, status, created_at) VALUES ($1, $2, $3, $4, $5, NOW())',
    [ruleId, agentId, naturalRuleText, JSON.stringify(parsedConditions), 'active']
  );

  console.log('Successfully seeded active rule:', ruleId);
  await pool.end();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
