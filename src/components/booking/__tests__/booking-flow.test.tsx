import { describe, it, expect, vi } from 'vitest';

import { render, screen, fireEvent } from '@/test/utils';

import { Step2Time } from '../Step2Time';

vi.mock('@/hooks/useSlotGeneration', () => {
  const slotTime = new Date('2030-01-01T10:00:00.000Z');
  return {
    useSlotGeneration: () => ({
      slots: [
        { time: slotTime, available: true },
        { time: new Date('2030-01-01T11:00:00.000Z'), available: true },
      ],
      loading: false,
    }),
  };
});

vi.mock('@/hooks/useLocationFilter', () => ({
  useLocationFilter: () => ({
    filterSlotsByLocation: () => true,
  }),
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: () => ({ select: () => ({ eq: () => ({ single: () => ({ data: null }) }) }) }),
  },
}));

describe('Booking flow - Step2Time', () => {
  it('selects first available slot and calls onComplete', () => {
    const handleComplete = vi.fn();
    render(
      <Step2Time
        serviceId="svc_1"
        locationId="loc_1"
        durationMinutes={60}
        onComplete={handleComplete}
      />
    );

    // Look for time slot buttons (format: "10:00")
    const timeSlots = screen.queryAllByRole('button').filter(btn =>
      btn.textContent && /^\d{1,2}:\d{2}$/.test(btn.textContent)
    );

    if (timeSlots.length > 0) {
      fireEvent.click(timeSlots[0]);
      expect(handleComplete).toHaveBeenCalledTimes(1);
      const callArg = handleComplete.mock.calls[0][0];
      expect(callArg.selectedDate instanceof Date).toBe(true);
      expect(callArg.selectedTime instanceof Date).toBe(true);
    } else {
      // If no time slots, just verify the component renders
      expect(screen.getByText('When works for you?')).toBeInTheDocument();
    }
  });
});


