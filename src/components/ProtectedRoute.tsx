import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

type Props = {
  children: React.ReactNode;
};

export default function ProtectedRoute({ children }: Props) {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    let mounted = true;
    
    // Demo mode - skip authentication for development
    if (import.meta.env.VITE_SKIP_EMAIL_VERIFICATION === 'true') {
      setAuthenticated(true);
      setLoading(false);
      return;
    }
    
    (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (!mounted) return;
        setAuthenticated(Boolean(data.session));
      } catch (err) {
        setAuthenticated(false);
      } finally {
        setLoading(false);
      }
    })();

    // Also listen for auth state changes (sign in / sign out)
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      setAuthenticated(Boolean(session));
    });

    return () => {
      mounted = false;
      sub?.subscription.unsubscribe();
    };
  }, []);

  if (loading) return null; // or a spinner
  if (!authenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}
