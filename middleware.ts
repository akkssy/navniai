import { withAuth } from 'next-auth/middleware'

export default withAuth({
  pages: {
    signIn: '/login',
  },
})

// Protect these routes - require authentication
// Note: /workflow is intentionally NOT protected — builder works without login
// (LLM execution is client-side, runs save to localStorage for guests)
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/settings/:path*',
  ],
}

