import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

/**
 * Role-based route protection.
 *
 * Public browse, material pages and free downloads deliberately stay outside
 * the matcher — §5.1 requires them to work with no login at all.
 */
const RULES: { prefix: string; roles: string[] }[] = [
  { prefix: '/admin', roles: ['SUPER_ADMIN'] },
  { prefix: '/lecturer', roles: ['LECTURER', 'TA', 'SUPER_ADMIN'] },
  { prefix: '/dashboard', roles: ['STUDENT', 'SUPER_ADMIN'] },
  { prefix: '/upload', roles: ['STUDENT', 'LECTURER', 'TA', 'SUPER_ADMIN'] },
  { prefix: '/checkout', roles: ['STUDENT', 'LECTURER', 'TA', 'SUPER_ADMIN'] },
];

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const role = req.nextauth.token?.role as string | undefined;
    const rule = RULES.find((r) => pathname.startsWith(r.prefix));

    if (rule && role && !rule.roles.includes(role)) {
      const url = req.nextUrl.clone();
      url.pathname = '/denied';
      url.search = '';
      return NextResponse.rewrite(url);
    }
    return NextResponse.next();
  },
  {
    callbacks: {
      // Any signed-in user passes here; the role check above narrows it.
      authorized: ({ token }) => Boolean(token),
    },
    pages: { signIn: '/auth/sign-in' },
  }
);

export const config = {
  matcher: [
    '/admin/:path*',
    '/lecturer/:path*',
    '/dashboard/:path*',
    '/upload/:path*',
    '/checkout/:path*',
  ],
};
