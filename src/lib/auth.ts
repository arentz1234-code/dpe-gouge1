import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { query } from './db';

interface User {
  id: number;
  email: string;
  username: string;
  password: string;
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const users = await query<User>(
          'SELECT id, email, username, password FROM users WHERE email = ?',
          [credentials.email]
        );

        if (users.length === 0) {
          return null;
        }

        const user = users[0];
        const isValid = await bcrypt.compare(credentials.password, user.password);

        if (!isValid) {
          return null;
        }

        return {
          id: String(user.id),
          email: user.email,
          name: user.username,
        };
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.username = user.name || '';
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id: string; username: string }).id = token.id as string;
        (session.user as { id: string; username: string }).username = token.username as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
};
