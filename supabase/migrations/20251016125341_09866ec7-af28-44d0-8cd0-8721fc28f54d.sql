-- Fix function search_path for update_booking_draft_timestamp
-- Drop trigger first, then recreate function with proper search_path, then recreate trigger

DROP TRIGGER IF EXISTS update_booking_drafts_timestamp ON public.booking_drafts;
DROP FUNCTION IF EXISTS public.update_booking_draft_timestamp() CASCADE;

CREATE OR REPLACE FUNCTION public.update_booking_draft_timestamp()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- Recreate the trigger
CREATE TRIGGER update_booking_drafts_timestamp
  BEFORE UPDATE ON public.booking_drafts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_booking_draft_timestamp();