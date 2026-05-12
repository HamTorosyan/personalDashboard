import { MicrosoftAccountToken } from "@/lib/types"
import "next-auth"
import "next-auth/jwt"

declare module "next-auth" {
  interface Session {
    microsoftAccounts?: MicrosoftAccountToken[]
    zoomAccessToken?: string
    zoomRefreshToken?: string
    zoomExpiresAt?: number
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    microsoftAccounts?: MicrosoftAccountToken[]
    zoomAccessToken?: string
    zoomRefreshToken?: string
    zoomExpiresAt?: number
  }
}
