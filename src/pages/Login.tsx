import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FcGoogle } from "react-icons/fc";
import { FaApple } from "react-icons/fa";
import { TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  // If already signed in, redirect to /dashboard
  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      if (data.session) {
        navigate('/dashboard');
      }
    })();
    return () => { mounted = false; };
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-hero p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <Card className="shadow-card border border-border/50 backdrop-blur-xl">
          <CardHeader className="text-center space-y-2">
            <CardTitle className="font-serif text-3xl text-foreground">
              Welcome Back ✨
            </CardTitle>
            <p className="text-muted-foreground text-sm">
              Log in to your SheTrades account
            </p>
          </CardHeader>

          <CardContent className="space-y-5">
              {/* Email Login */}
              <div className="space-y-3">
                <Input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />

                <Input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer select-none text-sm text-muted-foreground">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded accent-primary cursor-pointer"
                    />
                    Remember me
                  </label>
                  <Link to="/reset-password" className="text-sm text-primary underline">
                    Forgot password?
                  </Link>
                </div>
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    setLoading(true);
                    try {
                      // Set remember-me flag BEFORE login so smartStorage uses the right store
                      if (rememberMe) {
                        localStorage.setItem('cw_remember_me', 'true');
                      } else {
                        localStorage.removeItem('cw_remember_me');
                        // Clear any stale session from localStorage so old sessions don't linger
                        Object.keys(localStorage)
                          .filter(k => k.startsWith('sb-'))
                          .forEach(k => localStorage.removeItem(k));
                      }
                      console.debug('Login: attempting signInWithPassword', { email });
                      const { data, error } = await supabase.auth.signInWithPassword({
                        email,
                        password,
                      });
                      console.debug('Login: signInWithPassword result', { data, error });
                      
                      if (error) throw error;
                      
                      // Verify session was stored
                      const { data: { session: storedSession } } = await supabase.auth.getSession();
                      console.debug('Login: session after login', { storedSession });
                      
                      if (!storedSession) {
                        console.error('Login: session not stored after successful login!');
                        throw new Error('Session not stored - please try again');
                      }
                      
                      toast({ title: "Logged in", description: "Welcome back!" });
                      navigate("/dashboard");
                    } catch (err: any) {
                      console.error('Login failed:', err);
                      toast({ title: "Login failed", description: err.message || String(err) });
                    } finally {
                      setLoading(false);
                    }
                  }}
                >
                  <Button type="submit" disabled={loading} className="w-full bg-primary text-primary-foreground py-5">
                    {loading ? "Logging in..." : "Login"}
                  </Button>
                </form>
              </div>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">
                    or continue with
                  </span>
                </div>
              </div>

              {/* Social Login Buttons (UI only) */}
              <div className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full flex items-center gap-3 py-5"
                  onClick={async () => {
                    setLoading(true);
                    // OAuth always remembers session (no checkbox before redirect possible)
                    localStorage.setItem('cw_remember_me', 'true');
                    try {
                      const { error } = await supabase.auth.signInWithOAuth({
                        provider: 'google',
                        options: { redirectTo: `${window.location.origin}/dashboard` },
                      });
                      if (error) throw error;
                    } catch (err: any) {
                      const isProviderDisabled = err.message?.includes('provider is not enabled');
                      toast({ 
                        title: 'Google sign-in failed', 
                        description: isProviderDisabled 
                          ? 'Google login is not enabled. Please enable it in Supabase Dashboard → Authentication → Providers'
                          : err.message || String(err),
                        variant: 'destructive'
                      });
                    } finally {
                      setLoading(false);
                    }
                  }}
                >
                  <FcGoogle className="text-xl" />
                  Continue with Google
                </Button>

                <Button
                  variant="outline"
                  className="w-full flex items-center gap-3 py-5"
                  onClick={async () => {
                    setLoading(true);
                    // OAuth always remembers session (no checkbox before redirect possible)
                    localStorage.setItem('cw_remember_me', 'true');
                    try {
                      const { error } = await supabase.auth.signInWithOAuth({
                        provider: 'apple',
                        options: { redirectTo: `${window.location.origin}/dashboard` },
                      });
                      if (error) throw error;
                    } catch (err: any) {
                      const isProviderDisabled = err.message?.includes('provider is not enabled');
                      toast({ 
                        title: 'Apple sign-in failed', 
                        description: isProviderDisabled 
                          ? 'Apple login is not enabled. Please enable it in Supabase Dashboard → Authentication → Providers'
                          : err.message || String(err),
                        variant: 'destructive'
                      });
                    } finally {
                      setLoading(false);
                    }
                  }}
                >
                  <FaApple className="text-xl" />
                  Continue with Apple
                </Button>

                <Button
                  variant="outline"
                  className="w-full flex items-center gap-3 py-5"
                  onClick={() => (window.location.href = "/auth/tradingview")}
                >
                  <TrendingUp className="text-xl" />
                  Continue with TradingView
                </Button>
              </div>

            <p className="text-center text-sm text-muted-foreground">
              Don’t have an account?{" "}
              <Link to="/register" className="text-primary underline">
                Create one
              </Link>
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
