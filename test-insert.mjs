import { createClient } from '@libsql/client';
import bcrypt from 'bcryptjs';

const client = createClient({
  url: 'libsql://dpe-gouge-arentz1234.aws-us-east-1.turso.io',
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function test() {
  try {
    const hashedPassword = await bcrypt.hash('password123', 10);
    console.log('Hashed password:', hashedPassword);
    
    const result = await client.execute({
      sql: 'INSERT INTO users (email, username, password) VALUES (?, ?, ?)',
      args: ['test3@test.com', 'testuser3', hashedPassword]
    });
    console.log('Insert result:', JSON.stringify(result, null, 2));
  } catch (e) {
    console.error('Error:', e);
  }
}

test();
