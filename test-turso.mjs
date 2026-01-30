import { createClient } from '@libsql/client';

const client = createClient({
  url: 'libsql://dpe-gouge-arentz1234.aws-us-east-1.turso.io',
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function test() {
  try {
    const result = await client.execute({
      sql: 'SELECT * FROM users WHERE email = ?',
      args: ['test@test.com']
    });
    console.log('Result:', JSON.stringify(result, null, 2));
    console.log('Rows:', result.rows);
    console.log('Length:', result.rows.length);
  } catch (e) {
    console.error('Error:', e);
  }
}

test();
