import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User, Settings, LogOut, Calendar, Heart, Shield } from "lucide-react";
import { useTranslation } from "react-i18next";

import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast aria-live="polite" aria-atomic="true"";

import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";


interface UserMenuProps {
  user: any;
}

const UserMenu = ({ user }: UserMenuProps) => {
  const [profile, setProfile] = useState<any>(null);
  // Persisted display name to avoid flicker on remounts (route/mode switches)
  const [displayName, setDisplayName] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('bm_display_name');
      if (cached) return cached;
    }
    return user?.email?.split("@")[0] || "User";
  });
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { toast aria-live="polite" aria-atomic="true" } = useToast();

  useEffect(() => {
    if (user) {
      loadUserData();
    }
  }, [user]);

  const loadUserData = async () => {
    try {
      // Fetch profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      setProfile(profileData);
      if (profileData?.full_name) {
        setDisplayName(profileData.full_name);
        try { localStorage.setItem('bm_display_name', profileData.full_name); } catch {}
      }

      // Check admin role
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .maybeSingle();
      
      setIsAdmin(!!roleData);
    } catch (error) {
      // User data load failed silently
    }
  };

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast aria-live="polite" aria-atomic="true"({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      navigate("/");
    }
  };

  const getInitials = () => {
    const source = profile?.full_name || displayName || user?.email || "User";
    return source
      .split(" ")
      .map((n: string) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="flex items-center gap-3 hover:bg-primary/10 px-3 py-2 h-auto"
        >
          <Avatar className="w-8 h-8 border-2 border-primary/20">
            <AvatarImage src={profile?.avatar_url} alt={displayName} />
            <AvatarFallback className="bg-primary/20 text-primary text-xs font-semibold">
              {getInitials()}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium text-foreground hidden md:inline">{displayName}</span>
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-56 bg-charcoal border-graphite/20 z-50">
        {/* User Info Header */}
        <div className="px-3 py-3 border-b border-graphite/50">
          <p className="text-sm font-semibold text-pearl">{displayName}</p>
          <p className="text-xs text-pearl/60">{user?.email}</p>
        </div>

        {/* Admin Badge */}
        {isAdmin && (
          <>
            <DropdownMenuItem
              onClick={() => navigate("/admin")}
              className="gap-3 cursor-pointer text-pearl hover:bg-cocoa/50 focus:bg-cocoa/50 focus:text-pearl"
            >
              <Shield className="w-4 h-4 text-champagne" />
              <span className="font-medium">Admin Panel</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-graphite/20" />
          </>
        )}

        {/* My Bookings */}
        <DropdownMenuItem
          onClick={() => navigate("/dashboard")}
          className="gap-3 cursor-pointer text-pearl hover:bg-cocoa/50 focus:bg-cocoa/50 focus:text-pearl"
        >
          <Calendar className="w-4 h-4" />
          <span>My Bookings</span>
        </DropdownMenuItem>

        {/* Favorites */}
        <DropdownMenuItem
          onClick={() => navigate("/dashboard?tab=favorites")}
          className="gap-3 cursor-pointer text-pearl hover:bg-cocoa/50 focus:bg-cocoa/50 focus:text-pearl"
        >
          <Heart className="w-4 h-4" />
          <span>Favorites</span>
        </DropdownMenuItem>

        {/* Settings */}
        <DropdownMenuItem
          onClick={() => navigate("/dashboard?tab=settings")}
          className="gap-3 cursor-pointer text-pearl hover:bg-cocoa/50 focus:bg-cocoa/50 focus:text-pearl"
        >
          <Settings className="w-4 h-4" />
          <span>Settings</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator className="bg-graphite/20" />

        {/* Sign Out */}
        <DropdownMenuItem
          onClick={handleSignOut}
          className="gap-3 cursor-pointer text-red-400 hover:bg-red-500/10 focus:bg-red-500/10 focus:text-red-400"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserMenu;
