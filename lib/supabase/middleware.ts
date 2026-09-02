import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  if (!supabaseUrl || !supabaseAnonKey) {
    return supabaseResponse;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  // Refresh auth token
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isAuthPage = path.startsWith('/login');
  const isPublicShare = path.startsWith('/share/');
  const isApiRoute = path.startsWith('/api/');
  const isStaticFile =
    path.startsWith('/_next') ||
    path.startsWith('/favicon.ico') ||
    path.includes('.');

  if (isStaticFile) {
    return supabaseResponse;
  }

  // 1. Unauthenticated users trying to access protected routes
  if (!user && !isAuthPage && !isPublicShare && !isApiRoute && path !== '/') {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirectTo', path);
    return NextResponse.redirect(url);
  }

  // 2. Authenticated user checks
  if (user) {
    // Check profile for active status and role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, is_active')
      .eq('id', user.id)
      .single();

    // If account deactivated
    if (profile && !profile.is_active) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('error', 'deactivated');
      const response = NextResponse.redirect(url);
      response.cookies.delete('sb-access-token');
      response.cookies.delete('sb-refresh-token');
      return response;
    }

    // If authenticated user visits /login, redirect to /dashboard
    if (isAuthPage || path === '/') {
      const url = request.nextUrl.clone();
      url.pathname = '/dashboard';
      url.searchParams.delete('redirectTo');
      return NextResponse.redirect(url);
    }

    // Admin routes guard
    if (path.startsWith('/admin') && profile?.role !== 'admin') {
      const url = request.nextUrl.clone();
      url.pathname = '/dashboard';
      url.searchParams.set('error', 'unauthorized');
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
