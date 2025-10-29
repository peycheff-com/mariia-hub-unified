-- Decrement package sessions on booking completion

CREATE OR REPLACE FUNCTION public.handle_booking_completed_package()
RETURNS trigger AS $$
BEGIN
  IF NEW.status = 'completed' AND NEW.is_package = true THEN
    UPDATE booking_packages
      SET sessions_used = sessions_used + 1,
          sessions_remaining = GREATEST(sessions_remaining - 1, 0)
      WHERE user_id = NEW.user_id
        AND service_id = NEW.service_id
        AND status = 'active'
      ORDER BY purchased_at ASC
      LIMIT 1;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_booking_completed_package ON public.bookings;
CREATE TRIGGER trg_booking_completed_package
AFTER UPDATE OF status ON public.bookings
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION public.handle_booking_completed_package();


