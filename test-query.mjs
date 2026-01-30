import { createClient } from '@libsql/client';

const client = createClient({
  url: 'libsql://dpe-gouge-arentz1234.aws-us-east-1.turso.io',
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function test() {
  try {
    const result = await client.execute({
      sql: 'SELECT id FROM users WHERE email = ?',
      args: ['test3@test.com']
    });
    console.log('Result:', JSON.stringify(result, null, 2));
    console.log('Row 0:', result.rows[0]);
    console.log('Row 0 id:', result.rows[0]?.id);
  } catch (e) {
    console.error('Error:', e);
  }
}

test();
