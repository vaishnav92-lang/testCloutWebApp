/**
 * AUTHENTICATION ROUTE HANDLER
 *
 * NextAuth.js route handler for /api/auth/[...nextauth]
 * Imports configuration from @/lib/auth
 */

import NextAuth from "next-auth"
import { authOptions } from "@/lib/auth"

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }