import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(
  request: NextRequest
) {
  let response = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },

        setAll(cookiesToSet) {
          cookiesToSet.forEach(
            ({ name, value, options }) => {
              request.cookies.set(
                name,
                value
              );

              response = NextResponse.next({
                request,
              });

              response.cookies.set(
                name,
                value,
                options
              );
            }
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname =
    request.nextUrl.pathname;

  /*
   * ADMIN PANELİ
   */
  if (
    pathname.startsWith("/admin")
  ) {
    if (!user) {
      return NextResponse.redirect(
        new URL(
          "/login",
          request.url
        )
      );
    }

    const { data: adminUser, error } =
      await supabase
        .from("admin_users")
        .select("user_id, role")
        .eq("user_id", user.id)
        .maybeSingle();

    if (
      error ||
      !adminUser ||
      adminUser.role !== "admin"
    ) {
      return NextResponse.redirect(
        new URL(
          "/",
          request.url
        )
      );
    }
  }

  /*
   * SAHA PERSONELİ EKRANI
   */
  if (
    pathname.startsWith("/saha")
  ) {
    if (!user) {
      return NextResponse.redirect(
        new URL(
          "/login",
          request.url
        )
      );
    }

    const { data: adminUser, error } =
      await supabase
        .from("admin_users")
        .select("user_id, role")
        .eq("user_id", user.id)
        .maybeSingle();

    if (
      error ||
      !adminUser ||
      adminUser.role !==
        "saha_personeli"
    ) {
      return NextResponse.redirect(
        new URL(
          "/",
          request.url
        )
      );
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/saha/:path*",
  ],
};