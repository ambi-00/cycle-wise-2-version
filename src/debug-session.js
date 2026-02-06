// Debug helper - paste this into browser console to check session status
// Usage: Copy and paste the checkSession() function into your browser console

async function checkSession() {
  console.log('=== SESSION DEBUG ===');
  
  // Check localStorage
  const lsKeys = Object.keys(localStorage).filter(k => k.includes('supabase') || k.includes('sb-'));
  console.log('LocalStorage Supabase keys:', lsKeys);
  lsKeys.forEach(k => {
    const val = localStorage.getItem(k);
    try {
      const parsed = JSON.parse(val);
      console.log(`${k}:`, {
        hasAccessToken: !!parsed?.access_token,
        hasRefreshToken: !!parsed?.refresh_token,
        expiresAt: parsed?.expires_at,
        user: parsed?.user?.email
      });
    } catch (e) {
      console.log(`${k}:`, val?.substring(0, 100));
    }
  });
  
  // Dynamic import to get supabase client
  const { supabase } = await import('./integrations/supabase/client.ts');
  
  // Check current session
  const { data: { session }, error: sessionErr } = await supabase.auth.getSession();
  console.log('Current session:', { session, sessionErr });
  
  // Try to get user
  const { data: { user }, error: userErr } = await supabase.auth.getUser();
  console.log('Current user:', { user: user?.email, userErr });
  
  // Try refresh
  const { data: { session: refreshed }, error: refreshErr } = await supabase.auth.refreshSession();
  console.log('Refreshed session:', { refreshed, refreshErr });
  
  console.log('=== END DEBUG ===');
}

console.log('Debug helper loaded. Run: checkSession()');
