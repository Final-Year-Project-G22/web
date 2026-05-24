import { type NextRequest, NextResponse } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";

const intlMiddleware = createIntlMiddleware(routing);

export function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;

  if (path.startsWith("/api/")) {
    const response = NextResponse.next();
    const token = request.cookies.get("access_token")?.value;
    if (token) {
      response.headers.set("Authorization", `Bearer ${token}`);
    }
    return response;
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ["/api/:path*", "/((?!api|_next|_vercel|auth|favicon|.*\\..*).*)"],
};
