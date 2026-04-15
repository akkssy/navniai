import { withAuth } from 'next-auth/middleware'

export default withAuth({
  pages: {
    signIn: '/login',
  },
})

// Protect these routes - require authentication
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/workflow/:path*',
    '/settings/:path*',
  ],
}

