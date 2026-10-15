import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import bcrypt from 'bcryptjs';
import prisma from './prisma';
import { logAuditEvent } from './audit';

// Auto-detect production URL on Vercel if NEXTAUTH_URL is missing or still points to localhost
if (process.env.VERCEL_URL && (!process.env.NEXTAUTH_URL || process.env.NEXTAUTH_URL.includes('localhost'))) {
  process.env.NEXTAUTH_URL = `https://${process.env.VERCEL_URL}`;
}
process.env.AUTH_TRUST_HOST = 'true';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      allowDangerousEmailAccountLinking: true,
    }),
    CredentialsProvider({
      id: 'credentials',
      name: 'Scholarly Account',
      credentials: {
        email: { label: 'Email', type: 'email', placeholder: 'scholar@institution.edu' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Please enter both email and password.');
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase().trim() },
          include: {
            roleAssignments: true,
          },
        });

        if (!user || !user.passwordHash) {
          throw new Error('Invalid email or password.');
        }

        if (!user.isActive) {
          throw new Error('This academic account has been suspended. Please contact the editorial office.');
        }

        const isValid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!isValid) {
          throw new Error('Invalid email or password.');
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
        };
      },
    }),
  ],
  events: {
    async createUser({ user }) {
      try {
        const masterAdminEmail = process.env.MASTER_ADMIN_EMAIL?.toLowerCase().trim();
        const isDesignatedAdmin = masterAdminEmail && user.email?.toLowerCase().trim() === masterAdminEmail;

        await prisma.userRoleAssignment.createMany({
          data: isDesignatedAdmin
            ? [
                { userId: user.id, role: 'MASTER_ADMIN' },
                { userId: user.id, role: 'AUTHOR' },
              ]
            : [
                { userId: user.id, role: 'AUTHOR' },
                { userId: user.id, role: 'READER' },
              ],
        });

        if (isDesignatedAdmin) {
          await logAuditEvent({
            userId: user.id,
            action: 'BOOTSTRAP_MASTER_ADMIN_GOOGLE',
            entityType: 'USER',
            entityId: user.id,
            details: { email: user.email, method: 'Google OAuth first-run' },
          });
        }
      } catch (err) {
        console.error('Failed to create default roles for new Google user in events.createUser:', err);
      }
    },
  },
  callbacks: {
    async signIn({ user, account }) {
      try {
        if (account?.provider === 'google' && user.email) {
          // If the user already exists in the database, ensure they have at least one role
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email.toLowerCase().trim() },
            include: { roleAssignments: true },
          });

          if (existingUser && existingUser.roleAssignments.length === 0) {
            const masterAdminEmail = process.env.MASTER_ADMIN_EMAIL?.toLowerCase().trim();
            const isDesignatedAdmin = masterAdminEmail && user.email.toLowerCase().trim() === masterAdminEmail;

            await prisma.userRoleAssignment.createMany({
              data: isDesignatedAdmin
                ? [
                    { userId: existingUser.id, role: 'MASTER_ADMIN' },
                    { userId: existingUser.id, role: 'AUTHOR' },
                  ]
                : [
                    { userId: existingUser.id, role: 'AUTHOR' },
                    { userId: existingUser.id, role: 'READER' },
                  ],
            });
          }
        }
        return true;
      } catch (error) {
        console.error('NextAuth signIn callback error:', error);
        return true;
      }
    },
    async jwt({ token, user }) {
      try {
        if (user) {
          token.id = user.id;
        }

        // If token.id is missing (e.g. initial OAuth token before adapter population), resolve by email
        if (!token.id && token.email) {
          const dbUserByEmail = await prisma.user.findUnique({
            where: { email: (token.email as string).toLowerCase().trim() },
            select: { id: true },
          });
          if (dbUserByEmail) {
            token.id = dbUserByEmail.id;
          }
        }

        if (token.id) {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.id as string },
            include: {
              roleAssignments: {
                include: { journal: { select: { slug: true, title: true } } },
              },
            },
          });
          if (dbUser) {
            token.roles = dbUser.roleAssignments.map(ra => ({
              role: ra.role,
              journalId: ra.journalId,
              journalSlug: ra.journal?.slug,
            }));
            token.affiliation = dbUser.affiliation;
            token.orcid = dbUser.orcid;
          }
        }
      } catch (err) {
        console.error('NextAuth jwt callback error:', err);
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token) {
        (session.user as any).id = token.id;
        (session.user as any).roles = token.roles || [];
        (session.user as any).affiliation = token.affiliation;
        (session.user as any).orcid = token.orcid;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
