import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';

const PROTECTED_PATHS = [
  '/gallery',
  '/birthdays',
  '/festivals',
  '/expenses',
  '/polls',
  '/payments',
  '/family-tree',
  '/admin',
  '/profile',
  '/prt-meetings',
];

export async function middleware(req) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name) {
          return req.cookies.get(name)?.value;
        },
        set(name, value, options) {
          req.cookies.set({ name, value, ...options });
        },
        remove(name, options) {
          req.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  const { data: { session } } = await supabase.auth.getSession();

  const isProtectedPath = PROTECTED_PATHS.some(path => req.nextUrl.pathname.startsWith(path));

  if (isProtectedPath && !session) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // Check admin-only paths
  const ADMIN_ONLY_PATHS = ['/admin'];
  const isAdminOnlyPath = ADMIN_ONLY_PATHS.some(path => req.nextUrl.pathname.startsWith(path));

  if (isAdminOnlyPath && session) {
    // Get user profile to check role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    // Only allow admin and expense_manager to access admin
    if (!profile || (profile.role !== 'admin' && profile.role !== 'expense_manager')) {
      return NextResponse.redirect(new URL('/', req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'],
};
