import { type NextRequest, NextResponse } from "next/server";

export function proxy(request: NextRequest) {
  const response = NextResponse.next();

  const token = request.cookies.get("access_token")?.value;

  if (token) {
    response.headers.set("Authorization", `Bearer ${token}`);
  }

  return response;
}

export const config = {
  matcher: ["/api/:path*"],
};
