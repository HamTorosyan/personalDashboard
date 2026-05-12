import NextAuth from "next-auth"
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id"
import Zoom from "next-auth/providers/zoom"
import type { MicrosoftAccountToken } from "@/lib/types"

async function refreshMicrosoftToken(token: MicrosoftAccountToken): Promise<MicrosoftAccountToken> {
  const response = await fetch(
    "https://login.microsoftonline.com/common/oauth2/v2.0/token",
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.MICROSOFT_CLIENT_ID!,
        client_secret: process.env.MICROSOFT_CLIENT_SECRET!,
        grant_type: "refresh_token",
        refresh_token: token.refreshToken,
        scope: "openid profile email offline_access Calendars.Read",
      }),
    }
  )
  const tokens = await response.json()
  if (!response.ok) throw new Error(`MS token refresh failed: ${tokens.error_description}`)
  return {
    ...token,
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token ?? token.refreshToken,
    expiresAt: Math.floor(Date.now() / 1000) + tokens.expires_in,
  }
}

async function refreshZoomToken(refreshToken: string): Promise<{
  accessToken: string
  refreshToken: string
  expiresAt: number
}> {
  const credentials = Buffer.from(
    `${process.env.ZOOM_CLIENT_ID}:${process.env.ZOOM_CLIENT_SECRET}`
  ).toString("base64")
  const response = await fetch(
    `https://zoom.us/oauth/token?grant_type=refresh_token&refresh_token=${refreshToken}`,
    {
      method: "POST",
      headers: { Authorization: `Basic ${credentials}` },
    }
  )
  const tokens = await response.json()
  if (!response.ok) throw new Error(`Zoom token refresh failed: ${tokens.reason}`)
  return {
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token ?? refreshToken,
    expiresAt: Math.floor(Date.now() / 1000) + tokens.expires_in,
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    MicrosoftEntraID({
      clientId: process.env.MICROSOFT_CLIENT_ID!,
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET!,
      // "common" allows both M365 org accounts and personal Outlook/Hotmail accounts
      issuer: "https://login.microsoftonline.com/common/v2.0",
      authorization: {
        params: {
          scope: "openid profile email offline_access Calendars.Read",
          prompt: "select_account",
        },
      },
    }),
    Zoom({
      clientId: process.env.ZOOM_CLIENT_ID!,
      clientSecret: process.env.ZOOM_CLIENT_SECRET!,
    }),
  ],

  callbacks: {
    async jwt({ token, account }) {
      // New sign-in — persist tokens
      if (account) {
        if (account.provider === "microsoft-entra-id") {
          const existing = (token.microsoftAccounts as MicrosoftAccountToken[]) ?? []
          const oid = account.providerAccountId
          const updated: MicrosoftAccountToken[] = [
            ...existing.filter((a) => a.oid !== oid),
            {
              oid,
              accessToken: account.access_token!,
              refreshToken: account.refresh_token!,
              expiresAt: account.expires_at!,
            },
          ]
          token.microsoftAccounts = updated
        }
        if (account.provider === "zoom") {
          token.zoomAccessToken = account.access_token
          token.zoomRefreshToken = account.refresh_token
          token.zoomExpiresAt = account.expires_at
        }
        return token
      }

      const now = Math.floor(Date.now() / 1000)

      // Refresh expired Microsoft tokens
      if (token.microsoftAccounts) {
        const refreshed = await Promise.all(
          (token.microsoftAccounts as MicrosoftAccountToken[]).map(async (acct) => {
            if (now < acct.expiresAt - 60) return acct
            try {
              return await refreshMicrosoftToken(acct)
            } catch {
              return acct
            }
          })
        )
        token.microsoftAccounts = refreshed
      }

      // Refresh expired Zoom token
      if (
        token.zoomRefreshToken &&
        token.zoomExpiresAt &&
        now >= (token.zoomExpiresAt as number) - 60
      ) {
        try {
          const refreshed = await refreshZoomToken(token.zoomRefreshToken as string)
          token.zoomAccessToken = refreshed.accessToken
          token.zoomRefreshToken = refreshed.refreshToken
          token.zoomExpiresAt = refreshed.expiresAt
        } catch {
          // keep existing token and let the next request fail gracefully
        }
      }

      return token
    },

    async session({ session, token }) {
      session.microsoftAccounts = token.microsoftAccounts as MicrosoftAccountToken[] | undefined
      session.zoomAccessToken = token.zoomAccessToken as string | undefined
      session.zoomRefreshToken = token.zoomRefreshToken as string | undefined
      session.zoomExpiresAt = token.zoomExpiresAt as number | undefined
      return session
    },
  },

  pages: {
    signIn: "/auth/signin",
  },
})
