import NextAuth, { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      firstName?: string | null
      lastName?: string | null
      isProfileComplete: boolean
      referralCode: string
      inviteUsed: boolean
      isHiringManager: boolean
      isGrantmaker: boolean
      isAdmin: boolean
    } & DefaultSession["user"]
  }

  interface User {
    id: string
    firstName?: string | null
    lastName?: string | null
    isProfileComplete: boolean
    referralCode: string
    inviteUsed: boolean
    isHiringManager: boolean
    isGrantmaker: boolean
    isAdmin: boolean
  }
}