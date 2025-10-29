import { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback } from "react";
import { useLocation } from "react-router-dom";

import { supabase } from "@/integrations/supabase/client";

type Mode = "beauty" | "fitness" | null;

interface ModeContextType {
  mode: Mode;
  setMode: (mode: Mode) => void;
  isLoading: boolean;
}

const ModeContext = createContext<ModeContextType | undefined>(undefined);

// Generate or retrieve session ID
const getSessionId = (): string => {
  let sessionId = sessionStorage.getItem("bm_session_id");
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem("bm_session_id", sessionId);
  }
  return sessionId;
};

export const ModeProvider = ({ children }: { children: ReactNode }) => {
  const [mode, setModeState] = useState<Mode>(null);
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();

  // Detect mode from URL on initial load - memoized
  const detectModeFromUrl = useCallback(() => {
    const path = location.pathname;
    // Home should never have a mode selected
    if (path === "/") {
      // Clear mode and theme attribute for home
      setModeState(null);
      try {
        localStorage.removeItem("bm_mode");
      } catch {}
      if (typeof document !== 'undefined') {
        document.documentElement.removeAttribute('data-mode');
      }
      return null;
    }
    if (path.startsWith("/beauty") || path.startsWith("/lp/beauty")) {
      return "beauty";
    } else if (path.startsWith("/fitness") || path.startsWith("/lp/fitness")) {
      return "fitness";
    }
    return null;
  }, [location.pathname]);

  useEffect(() => {
    const urlMode = detectModeFromUrl();
    if (urlMode && urlMode !== mode) {
      setModeState(urlMode);
      if (typeof document !== 'undefined') {
        document.documentElement.setAttribute('data-mode', urlMode);
      }
    }
  }, [detectModeFromUrl]);

  // Load saved mode preference on mount
  useEffect(() => {
    loadModePreference();
  }, []);

  const loadModePreference = async () => {
    try {
      // Do not load persisted mode on the home page – it must always be unset
      if (typeof window !== 'undefined' && window.location.pathname === '/') {
        setIsLoading(false);
        return;
      }
      const sessionId = getSessionId();
      const { data: { user } } = await supabase.auth.getUser();

      // Only query if we have a user ID or session ID
      if (!user?.id && !sessionId) {
        // Fallback to localStorage
        const savedMode = localStorage.getItem("bm_mode");
        if (savedMode === "beauty" || savedMode === "fitness") {
          setModeState(savedMode);
        }
        setIsLoading(false);
        return;
      }

      // Try to load from database
      const { data } = await supabase
        .from("user_mode_preferences")
        .select("preferred_mode")
        .or(user?.id
          ? `user_id.eq.${user.id},session_id.eq.${sessionId}`
          : `user_id.is.null,session_id.eq.${sessionId}`)
        .maybeSingle();

      if (data?.preferred_mode) {
        setModeState(data.preferred_mode as Mode);
      } else {
        // Fallback to localStorage
        const savedMode = localStorage.getItem("bm_mode");
        if (savedMode === "beauty" || savedMode === "fitness") {
          setModeState(savedMode);
        }
      }
    } catch (error) {
      // Mode preference load failed silently
    } finally {
      setIsLoading(false);
    }
  };

  const setMode = async (newMode: Mode) => {
    setModeState(newMode);
    // Reflect mode to DOM for CSS variable theming
    if (typeof document !== 'undefined') {
      const html = document.documentElement;
      if (newMode) {
        html.setAttribute('data-mode', newMode);
      } else {
        html.removeAttribute('data-mode');
      }
    }
    
    // Save to localStorage
    if (newMode) {
      localStorage.setItem("bm_mode", newMode);
    } else {
      localStorage.removeItem("bm_mode");
    }

    // Save to database
    try {
      const sessionId = getSessionId();
      const { data: { user } } = await supabase.auth.getUser();

      const { data: existing } = await supabase
        .from("user_mode_preferences")
        .select("id")
        .or(user?.id
          ? `user_id.eq.${user.id},session_id.eq.${sessionId}`
          : `user_id.is.null,session_id.eq.${sessionId}`)
        .maybeSingle();

      if (existing) {
        // Fetch current count and increment
        const { data: current } = await supabase
          .from("user_mode_preferences")
          .select("visit_count")
          .eq("id", existing.id)
          .single();
        
        await supabase
          .from("user_mode_preferences")
          .update({
            preferred_mode: newMode,
            visit_count: (current?.visit_count || 0) + 1,
            last_visited: new Date().toISOString(),
          })
          .eq("id", existing.id);
      } else {
        await supabase.from("user_mode_preferences").insert({
          user_id: user?.id || null,
          session_id: !user ? sessionId : null,
          preferred_mode: newMode,
        });
      }
    } catch (error) {
      // Mode preference save failed silently
    }
  };

  const contextValue = useMemo(() => ({
    mode,
    setMode,
    isLoading
  }), [mode, isLoading]);

  return (
    <ModeContext.Provider value={contextValue}>
      {children}
    </ModeContext.Provider>
  );
};

export const useMode = () => {
  const context = useContext(ModeContext);
  if (context === undefined) {
    throw new Error("useMode must be used within a ModeProvider");
  }
  return context;
};
