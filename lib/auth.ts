import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { prisma } from './prisma';
import { rateLimit, resetRateLimit, clientIp, SIGN_IN_LIMIT } from './rate-limit';

export const authOptions: NextAuthOptions = {
  session: { strategy: 'jwt', maxAge: 60 * 60 * 24 * 30 },
  pages: {
    signIn: '/auth/sign-in',
    error: '/auth/sign-in',
  },
  providers: [
    CredentialsProvider({
      name: 'Email and password',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials, req) {
        const email = credentials?.email?.trim().toLowerCase();
        const password = credentials?.password;
        if (!email || !password) return null;

        // Throttle per IP *and* per account: one attacker cannot grind a single
        // account, and a botnet cannot grind one account from many addresses.
        const ip = clientIp(req?.headers ?? {});
        const keys = [`signin:ip:${ip}`, `signin:user:${email}`];
        for (const key of keys) {
          if (!rateLimit(key, SIGN_IN_LIMIT.limit, SIGN_IN_LIMIT.windowMs).allowed) {
            // Same null as a wrong password: never reveal that an account exists.
            return null;
          }
        }

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !user.passwordHash || !user.active) return null;

        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return null;

        // Successful sign-in clears the counters for this user and address.
        for (const key of keys) resetRateLimit(key);

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        };
      },
    }),
    // Phase 2: add an EmailProvider (magic links) here once SMTP/Resend
    // credentials exist — the session callbacks below already carry the role.
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.uid = user.id;
        token.role = (user as { role?: string }).role;
      }
      // Keep the role fresh if an admin changes it mid-session.
      if (trigger === 'update' && token.uid) {
        const fresh = await prisma.user.findUnique({
          where: { id: token.uid as string },
          select: { role: true, name: true },
        });
        if (fresh) {
          token.role = fresh.role;
          token.name = fresh.name;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.uid as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
