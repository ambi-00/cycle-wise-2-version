import React, { useState } from "react";
import { User, LogOut, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export default function ProfileButton() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-10 w-10 items-center justify-center rounded-xl bg-card text-primary shadow-soft hover:shadow-md transition-shadow"
      >
        <User className="h-5 w-5" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-12 z-50 w-48 rounded-lg bg-card border border-border shadow-lg">
          <button
            onClick={() => {
              navigate('/profile');
              setIsOpen(false);
            }}
            className="flex items-center gap-3 w-full px-4 py-3 text-sm hover:bg-muted transition-colors rounded-t-lg"
          >
            <User className="h-4 w-4" />
            Profile
          </button>
          <button
            onClick={() => {
              navigate('/settings');
              setIsOpen(false);
            }}
            className="flex items-center gap-3 w-full px-4 py-3 text-sm hover:bg-muted transition-colors border-t border-border"
          >
            <Settings className="h-4 w-4" />
            Settings
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 text-sm text-destructive hover:bg-destructive/10 transition-colors rounded-b-lg border-t border-border"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}
