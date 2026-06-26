import { createBrowserClient } from '@supabase/ssr';
import type { CookieMethodsBrowser, CookieOptionsWithName } from '@supabase/ssr';
import type { SupabaseClientOptions } from '@supabase/supabase-js';

type BrowserClientOptions = SupabaseClientOptions<'public'> & {
  cookies?: CookieMethodsBrowser;
  cookieOptions?: CookieOptionsWithName;
  cookieEncoding?: 'raw' | 'base64url';
  isSingleton?: boolean;
};

export function createClient(options?: BrowserClientOptions) {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    options
  );
}
