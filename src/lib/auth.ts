import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import bcrypt from 'bcryptjs';
import prisma from './prisma';
import { logAuditEvent } from './audit';

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
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === 'google' && user.email) {
        // Find existing user or check if this user is designated MASTER_ADMIN_EMAIL
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email.toLowerCase() },
          include: { roleAssignments: true },
        });

        const masterAdminEmail = process.env.MASTER_ADMIN_EMAIL?.toLowerCase();
        const isDesignatedAdmin = masterAdminEmail && user.email.toLowerCase() === masterAdminEmail;

        if (!existingUser) {
          // If first time Google sign in, default role is AUTHOR
          // If matches designated MASTER_ADMIN_EMAIL, assign MASTER_ADMIN
          const newUser = await prisma.user.create({
            data: {
              email: user.email.toLowerCase(),
              name: user.name || 'Scholarly Author',
              image: user.image,
              roleAssignments: {
                create: isDesignatedAdmin
                  ? [{ role: 'MASTER_ADMIN' }, { role: 'AUTHOR' }]
                  : [{ role: 'AUTHOR' }, { role: 'READER' }],
              },
            },
          });

          if (isDesignatedAdmin) {
            await logAuditEvent({
              userId: newUser.id,
              action: 'BOOTSTRAP_MASTER_ADMIN_GOOGLE',
              entityType: 'USER',
              entityId: newUser.id,
              details: { email: newUser.email, method: 'Google OAuth first-run' },
            });
          }
        }
      }
      return true;
    },
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
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
