import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { useMode } from "@/contexts/ModeContext";
import { supabase } from "@/integrations/supabase/client";
import { log } from "@/lib/logger";

// Sanitize and validate input strings
const sanitizeInput = (input: string | null): string | null => {
  if (!input) return null;

  // Remove any HTML tags and potential XSS patterns
  const cleaned = input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]*>/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim();

  // Validate length and allowed characters
  if (cleaned.length > 100 || !/^[a-zA-Z0-9_-]+$/.test(cleaned)) {
    return null;
  }

  return cleaned;
};

// Validate URL parameters
const validateParams = (source: string | null, campaign: string | null, medium: string | null) => {
  return {
    source: sanitizeInput(source),
    campaign: sanitizeInput(campaign),
    medium: sanitizeInput(medium)
  };
};

// Map UTM sources/campaigns to likely services
const UTM_SERVICE_MAP: Record<string, { mode: "beauty" | "fitness"; service?: string }> = {
  // Beauty campaigns
  "lips": { mode: "beauty", service: "lip-blush" },
  "brows": { mode: "beauty", service: "nano-brows" },
  "eyeliner": { mode: "beauty", service: "eyeliner" },
  "lashes": { mode: "beauty", service: "lashes" },
  "beauty": { mode: "beauty" },
  
  // Fitness campaigns
  "pt": { mode: "fitness", service: "personal-training" },
  "personal-training": { mode: "fitness", service: "personal-training" },
  "online": { mode: "fitness", service: "online-coaching" },
  "rehab": { mode: "fitness", service: "rehabilitation" },
  "fitness": { mode: "fitness" },
};

const IntentRouter = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { setMode } = useMode();

  const handleIntent = async (
    source: string | null,
    campaign: string | null,
    medium: string | null
  ) => {
    // Try to match campaign or source to a service
    const intent = UTM_SERVICE_MAP[campaign?.toLowerCase() || ""] || 
                   UTM_SERVICE_MAP[source?.toLowerCase() || ""];

    if (intent) {
      // Set the mode
      await setMode(intent.mode);

      // Track the UTM in database
      try {
        const sessionId = sessionStorage.getItem("bm_session_id");
        const { data: { user } } = await supabase.auth.getUser();

        await supabase.from("user_mode_preferences").upsert({
          user_id: user?.id || null,
          session_id: !user ? sessionId : null,
          preferred_mode: intent.mode,
          utm_source: source,
          utm_campaign: campaign,
          utm_medium: medium,
          last_service_id: intent.service,
        });
      } catch (error) {
        log.error("Error tracking UTM:", error);
      }

      // If we're on homepage and have a specific service, navigate to booking
      if (location.pathname === "/" && intent.service) {
        // Ensure service and mode are valid
        if (/^[a-zA-Z0-9_-]+$/.test(intent.service) && /^(beauty|fitness)$/.test(intent.mode)) {
          const params = new URLSearchParams({
            service: intent.service,
            type: intent.mode,
          });
          navigate(`/book?${params.toString()}`);
        }
      } else if (location.pathname === "/") {
        // Navigate to the mode landing page
        navigate(`/${intent.mode}`);
      }
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const utmSource = params.get("utm_source");
    const utmCampaign = params.get("utm_campaign");
    const utmMedium = params.get("utm_medium");

    // Validate and sanitize parameters
    const { source, campaign, medium } = validateParams(utmSource, utmCampaign, utmMedium);

    // Check if we have valid UTM parameters
    if (source || campaign) {
      handleIntent(source, campaign, medium);
    }
  }, [location.search]);

  return null; // This is a logic-only component
};

export default IntentRouter;
