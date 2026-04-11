import { type NextRequest, NextResponse } from "next/server";

const PUBLIC_ROUTES = ["/", "/auth/login", "/auth/register"];
const PUBLIC_PREFIXES = ["/q/", "/p/", "/auth/"];

function isPublicRoute(pathname: string) {
  return (
    PUBLIC_ROUTES.includes(pathname) ||
    PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix))
  );
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Public routes — skip Supabase entirely
  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  // Protected routes — lazy import Supabase only when needed
  const { updateSession } = await import("./src/lib/supabase/middleware");
  const { supabaseResponse, user, supabase } = await updateSession(request);

  // Redirect to login if not authenticated
  if (!user) {
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Get user role from profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  // Manager routes — only managers allowed
  if (pathname.startsWith("/manager") && profile?.role !== "manager") {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  // Admin routes — admins and managers allowed
  if (pathname.startsWith("/admin") && !profile?.role) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icons/|manifest.json|sw.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
