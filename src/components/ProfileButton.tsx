import React, { useState } from "react";
import { User, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export const ProfileButton = () => {
  const navigate = useNavigate();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <div className="flex items-center gap-2">
      <button 
        onClick={() => navigate('/profile')}
        className="flex h-10 w-10 items-center justify-center rounded-xl bg-card text-primary shadow-soft hover:shadow-md transition-shadow"
      >
        <User className="h-5 w-5" />
      </button>

      <button 
        onClick={() => setShowLogoutDialog(true)}
        className="flex h-10 w-10 items-center justify-center rounded-xl bg-card text-destructive shadow-soft hover:shadow-md transition-shadow hover:bg-destructive/10"
      >
        <LogOut className="h-5 w-5" />
      </button>

      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>You wanna log out?</AlertDialogTitle>
            <AlertDialogDescription>
              You'll be signed out of your account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3 justify-end">
            <AlertDialogCancel>No</AlertDialogCancel>
            <AlertDialogAction onClick={handleLogout} className="bg-destructive hover:bg-destructive/90">
              Yes
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
