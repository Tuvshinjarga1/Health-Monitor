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
    async jwt({ token, account, user }) {
      // Анхны нэвтрэлтийн үеэр OAuth account мэдээлэл оруулж ирнэ
      if (account && user) {
        console.log("🔑 NextAuth: Анхны нэвтрэлт амжилттай", {
          provider: account.provider,
          type: account.type,
          userId: user.id,
          email: user.email,
          hasAccessToken: !!account.access_token,
          hasRefreshToken: !!account.refresh_token,
          expiresAt: account.expires_at,
          scope: account.scope?.substring(0, 50) + "...",
        });

        return {
          ...token,
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          tokenExpiry: account.expires_at,
          userId: user.id,
        };
      }

      console.log("🔄 NextAuth: JWT callback ажиллаж байна", {
        hasAccessToken: !!token.accessToken,
        hasRefreshToken: !!token.refreshToken,
        tokenExpiry: token.tokenExpiry,
      });

      // Refresh токен байгаа бол токен хугацаа дуусахаас 24 цагийн өмнө шинэчлэнэ
      // if (
      //   token.refreshToken &&
      //   token.tokenExpiry &&
      //   Date.now() > (token.tokenExpiry as number - 24 * 60 * 60) * 1000
      // ) {
      //   console.log("⏰ NextAuth: Токен хугацаа дуусч шинэчлэх шаардлагатай");
      //   // Token refresh logic could be here
      // }

      return token;
    },
    async session({ session, token }) {
      console.log("📋 NextAuth: Session руу токен хувиргаж байна", {
        hasAccessToken: !!token.accessToken,
        hasRefreshToken: !!token.refreshToken,
        tokenExpiry: token.tokenExpiry,
        userId: token.userId,
        userEmail: session.user?.email,
      });

      session.accessToken = token.accessToken as string;
      session.refreshToken = token.refreshToken as string;
      session.tokenExpiry = token.tokenExpiry as number;

      // Токен шалгалт
      if (!session.accessToken) {
        console.error("❌ NextAuth: Access token олдсонгүй!");
        session.error = "access_token_missing";
      }

      if (!session.refreshToken) {
        console.error("❌ NextAuth: Refresh token олдсонгүй!");
        session.error = "refresh_token_missing";
      }

      return session;
    },
  },
  debug: true,
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
});

// App Router structure дээр GET ба POST аль алинд ашиглагдана
export { handler as GET, handler as POST };
