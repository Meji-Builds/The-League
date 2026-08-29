import { createBrowserClient } from "@supabase/ssr";

// Types are defined in types/database.ts and used at the call site.
// We wire up the Database generic once we have a real Supabase project
// and can run `supabase gen types typescript` to get accurate types.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
