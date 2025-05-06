import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

// Session төрөлд accessToken нэмэх
declare module "next-auth" {
  interface Session {
    accessToken?: string;
    refreshToken?: string;
    tokenExpiry?: number;
    error?: string;
  }
}

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: [
            "openid",
            "email",
            "profile",
            "https://www.googleapis.com/auth/fitness.activity.read",
            "https://www.googleapis.com/auth/fitness.body.read",
            "https://www.googleapis.com/auth/fitness.heart_rate.read",
            "https://www.googleapis.com/auth/fitness.location.read",
            "https://www.googleapis.com/auth/fitness.nutrition.read",
            "https://www.googleapis.com/auth/fitness.sleep.read",
          ].join(" "),
          access_type: "offline",
          prompt: "consent",
          response_type: "code",
          include_granted_scopes: true,
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.tokenExpiry = account.expires_at;
      }
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string;
      session.refreshToken = token.refreshToken as string;
      session.tokenExpiry = token.tokenExpiry as number;
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
});

// App Router structure дээр GET ба POST аль алинд ашиглагдана
export { handler as GET, handler as POST };
