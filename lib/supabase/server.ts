import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Types are defined in types/database.ts and used at the call site.
// Wire up the Database generic once `supabase gen types typescript` is available.
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Called from a Server Component — cookies can only be set in
            // Server Actions or Route Handlers. Safe to ignore here.
          }
        },
      },
    }
  );
}
