import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "./src/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  const { supabaseResponse, user, supabase } = await updateSession(request);
  const pathname = request.nextUrl.pathname;

  // Public routes — no auth required
  if (
    pathname.startsWith("/q/") ||
    pathname.startsWith("/p/") ||
    pathname === "/" ||
    pathname.startsWith("/auth/")
  ) {
    return supabaseResponse;
  }

  // Protected routes — redirect to login if not authenticated
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
