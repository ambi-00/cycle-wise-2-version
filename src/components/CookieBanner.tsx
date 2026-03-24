import { useState, useEffect } from "react";
import { Cookie, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const CONSENT_KEY = "cw_cookie_consent";

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(CONSENT_KEY);
    if (!stored) setVisible(true);
  }, []);

  const accept = () => {
    localStorage.setItem(CONSENT_KEY, "accepted");
    setVisible(false);
  };

  const decline = () => {
    localStorage.setItem(CONSENT_KEY, "declined");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[9999] p-4 bg-card border-t border-border shadow-2xl">
      <div className="mx-auto max-w-5xl flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex-shrink-0 rounded-xl bg-primary/10 p-2 mt-0.5">
          <Cookie className="h-5 w-5 text-primary" />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground mb-1">
            We use cookies &amp; local storage
          </p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            We use technically necessary cookies for authentication (Supabase session) and local
            storage to save your app data. Your cycle and trading data is health &amp; financial
            data processed under GDPR Art. 9. By clicking <strong>Accept</strong> you consent to
            this processing.{" "}
            <Link to="/privacy" className="underline hover:text-foreground transition-colors">
              Privacy Policy
            </Link>{" "}
            ·{" "}
            <Link to="/impressum" className="underline hover:text-foreground transition-colors">
              Legal Notice
            </Link>
          </p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <Button size="sm" variant="outline" onClick={decline} className="text-xs h-8">
            Decline optional
          </Button>
          <Button size="sm" onClick={accept} className="text-xs h-8">
            Accept all
          </Button>
          <button
            onClick={decline}
            aria-label="Close"
            className="ml-1 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
