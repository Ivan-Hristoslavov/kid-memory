import { NextRequest, NextResponse } from "next/server";

/**
 * HTTP Basic auth gate for the private admin dashboard.
 * Credentials come from ADMIN_USER / ADMIN_PASSWORD env vars.
 * Next 16 renamed the `middleware` convention to `proxy`.
 */
export function proxy(req: NextRequest) {
  // Test mode leaves /admin open for QA — never enable in production.
  if (process.env.TEST_MODE === "true") {
    return NextResponse.next();
  }

  const user = process.env.ADMIN_USER;
  const pass = process.env.ADMIN_PASSWORD;

  if (!user || !pass) {
    return new NextResponse("Admin access is not configured", { status: 503 });
  }

  const auth = req.headers.get("authorization") ?? "";
  const expected = "Basic " + btoa(`${user}:${pass}`);

  if (auth !== expected) {
    return new NextResponse("Authentication required", {
      status: 401,
      headers: { "WWW-Authenticate": 'Basic realm="Admin", charset="UTF-8"' },
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
