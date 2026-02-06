import React from "react";
import { User } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function ProfileButton() {
  const navigate = useNavigate();

  return (
    <div className="relative">
      <button 
        onClick={() => navigate('/profile')}
        className="flex h-10 w-10 items-center justify-center rounded-xl bg-card text-primary shadow-soft hover:shadow-md transition-shadow"
      >
        <User className="h-5 w-5" />
      </button>
    </div>
  );
}
