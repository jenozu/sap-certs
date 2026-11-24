import NextAuth from 'next-auth';
import GitHub from 'next-auth/providers/github';

export const { handlers, auth } = NextAuth({
  providers: [GitHub],
  session: { strategy: 'jwt' },
  callbacks: {
    async signIn({ account, profile }) {
      return account?.provider === 'github' && typeof profile?.login === 'string'
        && profile.login.toLowerCase() === 'jenozu';
    },
    async jwt({ token, account }) {
      if (account?.provider === 'github') token.sub = 'github:' + account.providerAccountId;
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) Object.assign(session.user, { id: token.sub });
      return session;
    },
  },
});
