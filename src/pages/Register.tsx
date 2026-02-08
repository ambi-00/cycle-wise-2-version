import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FcGoogle } from "react-icons/fc";
import { FaApple } from "react-icons/fa";
import { TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const skipEmail = import.meta.env.VITE_SKIP_EMAIL_VERIFICATION === "true";

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
              Create Your Account 
            </CardTitle>
            <p className="text-muted-foreground text-sm">
              Start your SheTrades journey
            </p>
          </CardHeader>

          <CardContent className="space-y-5">
            {/* Email Registration */}
            <div className="space-y-3">
              <Input
                type="text"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />

              <Input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <Input
                type="password"
                placeholder="Create a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              <Input
                type="password"
                placeholder="Confirm your password"
                value={password2}
                onChange={(e) => setPassword2(e.target.value)}
              />
        <form
                onSubmit={async (e) => {
                  e.preventDefault();

                  // Basic client-side validation
                  if (!email || !password || !password2) {
                    toast({ title: "Missing fields", description: "Please provide an email and password." });
                    return;
                  }

                  if (password !== password2) {
                    toast({ title: "Passwords don't match", description: "Your passwords must be identical." });
                    return;
                  }

                  if (password.length < 6) {
                    toast({ title: "Weak password", description: "Password must be at least 6 characters." });
                    return;
                  }

                  setLoading(true);
                  try {
                    const { data, error } = await supabase.auth.signUp({
                      email,
                      password,
                      options: {
                        // after the user clicks the confirmation link, redirect them to our login page
                        emailRedirectTo: `${window.location.origin}/login`,
                      },
                    });

                    if (error) throw error;

                    toast({ title: "Check your email", description: "We sent a confirmation link to your email." });

                    // Try to set user metadata (best-effort)
                    try {
                      await supabase.auth.updateUser({ data: { name } });
                    } catch (e) {
                      console.error("updateUser failed:", e);
                    }

                    // If in dev mode, optionally skip email verification and sign in immediately
                    if (skipEmail) {
                      try {
                        await supabase.auth.signInWithPassword({ email, password });
                        navigate("/dashboard");
                        return;
                      } catch (e) {
                        console.error("auto sign-in failed:", e);
                      }
                    }

                    // Navigate to a welcome/confirmation page and pass name in state
                    navigate("/welcome", { state: { name } });
                  } catch (err: unknown) {
                    console.error("Registration error:", err);
                    const message = err instanceof Error ? err.message : String(err);
                    toast({ title: "Registration failed", description: message });
                  } finally {
                    setLoading(false);
                  }
                }}
              >
                <Button type="submit" disabled={loading} className="w-full bg-primary text-primary-foreground py-5">
                  {loading ? "Creating..." : "Create Account"}
                </Button>
              </form>
            </div>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">
                  or sign up with
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
                  try {
                    const { error } = await supabase.auth.signInWithOAuth({
                      provider: 'google',
                      options: { redirectTo: `${window.location.origin}/dashboard` },
                    });
                    if (error) throw error;
                  } catch (err: any) {
                    const isProviderDisabled = err.message?.includes('provider is not enabled');
                    toast({ 
                      title: 'Google sign-up failed', 
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
                Sign up with Google
              </Button>

              <Button
                variant="outline"
                className="w-full flex items-center gap-3 py-5"
                onClick={async () => {
                  setLoading(true);
                  try {
                    const { error } = await supabase.auth.signInWithOAuth({
                      provider: 'apple',
                      options: { redirectTo: `${window.location.origin}/dashboard` },
                    });
                    if (error) throw error;
                  } catch (err: any) {
                    const isProviderDisabled = err.message?.includes('provider is not enabled');
                    toast({ 
                      title: 'Apple sign-up failed', 
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
                Sign up with Apple
              </Button>

              <Button
                variant="outline"
                className="w-full flex items-center gap-3 py-5"
                onClick={() => (window.location.href = "/auth/tradingview")}
              >
                <TrendingUp className="text-xl" />
                Sign up with TradingView
              </Button>
            </div>

            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link to="/login" className="text-primary underline">
                Login
              </Link>
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
