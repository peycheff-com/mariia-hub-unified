-- Migration: Booking Loyalty Integration Trigger
-- Description: Automatically award loyalty points when bookings are completed

-- Function to award points for completed bookings
CREATE OR REPLACE FUNCTION award_points_on_booking_completion()
RETURNS TRIGGER AS $$
DECLARE
  loyalty_program_id UUID;
  tier_multiplier DECIMAL DEFAULT 1.0;
  base_points INTEGER;
  final_points INTEGER;
BEGIN
  -- Only proceed if booking is completed
  IF NEW.status != 'completed' OR OLD.status = 'completed' THEN
    RETURN NEW;
  END IF;

  -- Get active loyalty program
  SELECT id INTO loyalty_program_id
  FROM loyalty_programs
  WHERE is_active = true
  LIMIT 1;

  IF loyalty_program_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Get customer's tier multiplier
  SELECT COALESCE(lt.point_multiplier, 1.0) INTO tier_multiplier
  FROM customer_loyalty cl
  JOIN loyalty_tiers lt ON cl.tier = lt.name AND lt.program_id = cl.program_id
  WHERE cl.customer_id = NEW.client_id AND cl.program_id = loyalty_program_id;

  -- Calculate points (1 point per currency unit, adjusted by multiplier)
  base_points := FLOOR(NEW.total_price);
  final_points := FLOOR(base_points * tier_multiplier);

  -- Award the points
  PERFORM earn_loyalty_points(
    p_customer_id := NEW.client_id,
    p_program_id := loyalty_program_id,
    p_points := final_points,
    p_reference_id := NEW.id,
    p_reference_type := 'booking',
    p_description := 'Points earned for completed booking'
  );

  -- Check and update booking streak
  PERFORM update_booking_streak_on_completion(NEW.client_id);

  -- Check for new achievements
  PERFORM check_booking_achievements(NEW.client_id, loyalty_program_id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update booking streak
CREATE OR REPLACE FUNCTION update_booking_streak_on_completion(p_customer_id UUID)
RETURNS VOID AS $$
DECLARE
  streak_record customer_streaks%ROWTYPE;
  today DATE := CURRENT_DATE;
BEGIN
  -- Get existing streak
  SELECT * INTO streak_record
  FROM customer_streaks
  WHERE customer_id = p_customer_id AND streak_type = 'booking';

  IF NOT FOUND THEN
    -- Create new streak
    INSERT INTO customer_streaks (
      customer_id,
      streak_type,
      current_streak,
      longest_streak,
      last_activity,
      next_bonus_threshold
    ) VALUES (
      p_customer_id,
      'booking',
      1,
      1,
      today,
      3
    );
  ELSE
    -- Update existing streak
    IF streak_record.last_activity IS NULL OR
       (today - streak_record.last_activity) <= 31 THEN
      -- Continue or start streak
      UPDATE customer_streaks
      SET
        current_streak = streak_record.current_streak + 1,
        longest_streak = GREATEST(streak_record.longest_streak, streak_record.current_streak + 1),
        last_activity = today,
        updated_at = now()
      WHERE id = streak_record.id;

      -- Check for streak bonuses
      IF (streak_record.current_streak + 1) IN (3, 6, 12) THEN
        DECLARE
          program_id UUID;
          bonus_points INTEGER := (streak_record.current_streak + 1) * 10;
        BEGIN
          SELECT id INTO program_id
          FROM loyalty_programs
          WHERE is_active = true
          LIMIT 1;

          IF program_id IS NOT NULL THEN
            PERFORM earn_loyalty_points(
              p_customer_id := p_customer_id,
              p_program_id := program_id,
              p_points := bonus_points,
              p_reference_type := 'streak_bonus',
              p_description := format('%s-month streak bonus!', streak_record.current_streak + 1)
            );
          END IF;
        END;
      END IF;
    ELSE
      -- Reset streak (too much time passed)
      UPDATE customer_streaks
      SET
        current_streak = 1,
        last_activity = today,
        updated_at = now()
      WHERE id = streak_record.id;
    END IF;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to check booking achievements
CREATE OR REPLACE FUNCTION check_booking_achievements(p_customer_id UUID, p_program_id UUID)
RETURNS VOID AS $$
DECLARE
  achievement achievement_badges%ROWTYPE;
  achievement_earned BOOLEAN;
BEGIN
  -- Check first booking achievement
  SELECT * INTO achievement
  FROM achievement_badges
  WHERE criteria->>'type' = 'first_booking' AND is_active = true;

  IF FOUND THEN
    -- Check if already earned
    SELECT 1 INTO achievement_earned
    FROM customer_achievements
    WHERE customer_id = p_customer_id AND badge_id = achievement.id
    LIMIT 1;

    IF NOT FOUND THEN
      -- Check if they have completed bookings
      SELECT 1 INTO achievement_earned
      FROM bookings
      WHERE client_id = p_customer_id AND status = 'completed'
      LIMIT 1;

      IF FOUND THEN
        -- Award achievement
        INSERT INTO customer_achievements (customer_id, badge_id)
        VALUES (p_customer_id, achievement.id);

        -- Award achievement points
        IF achievement.points_awarded > 0 THEN
          PERFORM earn_loyalty_points(
            p_customer_id := p_customer_id,
            p_program_id := p_program_id,
            p_points := achievement.points_awarded,
            p_reference_id := achievement.id,
            p_reference_type := 'achievement',
            p_description := 'Achievement: First Booking'
          );
        END IF;
      END IF;
    END IF;
  END IF;

  -- Check booking count achievements
  FOR achievement IN
    SELECT * FROM achievement_badges
    WHERE criteria->>'type' = 'booking_count' AND is_active = true
  LOOP
    SELECT 1 INTO achievement_earned
    FROM customer_achievements
    WHERE customer_id = p_customer_id AND badge_id = achievement.id
    LIMIT 1;

    IF NOT FOUND THEN
      DECLARE
        booking_count INTEGER;
        required_count INTEGER := (achievement.criteria->>'count')::INTEGER;
      BEGIN
        SELECT COUNT(*) INTO booking_count
        FROM bookings
        WHERE client_id = p_customer_id AND status = 'completed';

        IF booking_count >= required_count THEN
          -- Award achievement
          INSERT INTO customer_achievements (customer_id, badge_id)
          VALUES (p_customer_id, achievement.id);

          -- Award achievement points
          IF achievement.points_awarded > 0 THEN
            PERFORM earn_loyalty_points(
              p_customer_id := p_customer_id,
              p_program_id := p_program_id,
              p_points := achievement.points_awarded,
              p_reference_id := achievement.id,
              p_reference_type := 'achievement',
              p_description := format('Achievement: %s', achievement.name)
            );
          END IF;
        END IF;
      END;
    END IF;
  END LOOP;

  -- Check birthday booking achievement
  SELECT * INTO achievement
  FROM achievement_badges
  WHERE criteria->>'type' = 'birthday_booking' AND is_active = true;

  IF FOUND THEN
    SELECT 1 INTO achievement_earned
    FROM customer_achievements
    WHERE customer_id = p_customer_id AND badge_id = achievement.id
    LIMIT 1;

    IF NOT FOUND THEN
      DECLARE
        is_birthday BOOLEAN;
      BEGIN
        -- Check if today is customer's birthday and they have a booking
        SELECT (DATE_PART('day', dob) = DATE_PART('day', CURRENT_DATE) AND
                DATE_PART('month', dob) = DATE_PART('month', CURRENT_DATE)) INTO is_birthday
        FROM profiles
        WHERE id = p_customer_id AND date_of_birth IS NOT NULL
        LIMIT 1;

        IF is_birthday THEN
          SELECT 1 INTO achievement_earned
          FROM bookings
          WHERE client_id = p_customer_id
            AND status = 'completed'
            AND DATE(start_time) = CURRENT_DATE
          LIMIT 1;

          IF achievement_earned THEN
            -- Award achievement
            INSERT INTO customer_achievements (customer_id, badge_id)
            VALUES (p_customer_id, achievement.id);

            -- Award achievement points
            IF achievement.points_awarded > 0 THEN
              PERFORM earn_loyalty_points(
                p_customer_id := p_customer_id,
                p_program_id := p_program_id,
                p_points := achievement.points_awarded,
                p_reference_id := achievement.id,
                p_reference_type := 'achievement',
                p_description := 'Achievement: Birthday Booking'
              );
            END IF;
          END IF;
        END IF;
      END;
    END IF;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic point awarding
DROP TRIGGER IF EXISTS on_booking_complete_award_points ON bookings;
CREATE TRIGGER on_booking_complete_award_points
  AFTER UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION award_points_on_booking_completion();

-- Function to handle booking refunds
CREATE OR REPLACE FUNCTION handle_booking_refund()
RETURNS TRIGGER AS $$
DECLARE
  transaction_record point_transactions%ROWTYPE;
BEGIN
  -- Only proceed if booking is being cancelled or marked as no_show
  IF NEW.status IN ('cancelled', 'no_show') AND OLD.status NOT IN ('cancelled', 'no_show') THEN
    -- Find the original point transaction
    SELECT * INTO transaction_record
    FROM point_transactions
    WHERE reference_id = NEW.id
      AND reference_type = 'booking'
      AND transaction_type = 'earned'
    LIMIT 1;

    IF transaction_record IS NOT NULL THEN
      -- Remove the points
      PERFORM redeem_loyalty_points(
        p_customer_id := NEW.client_id,
        p_program_id := transaction_record.program_id,
        p_points := ABS(transaction_record.points),
        p_reference_id := NEW.id,
        p_reference_type := 'refund',
        p_description := 'Points refunded for cancelled booking'
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for handling refunds
DROP TRIGGER IF EXISTS on_booking_cancel_refund_points ON bookings;
CREATE TRIGGER on_booking_cancel_refund_points
  AFTER UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION handle_booking_refund();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION award_points_on_booking_completion() TO authenticated;
GRANT EXECUTE ON FUNCTION update_booking_streak_on_completion(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION check_booking_achievements(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION handle_booking_refund() TO authenticated;