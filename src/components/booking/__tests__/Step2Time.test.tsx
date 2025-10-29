import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { screen, fireEvent, render } from '@/test/utils/test-utils';

import { Step2Time } from '../Step2Time';

const mockedUseSlotGeneration = vi.hoisted(() =>
  vi.fn(() => ({ slots: [], loading: false }))
);

vi.mock('@/hooks/useSlotGeneration', () => ({
  useSlotGeneration: mockedUseSlotGeneration,
}));

describe('Step2Time', () => {
  beforeEach(() => {
    mockedUseSlotGeneration.mockReturnValue({ slots: [], loading: false });
  });

  afterEach(() => {
    mockedUseSlotGeneration.mockClear();
  });

  it('renders a fallback message when no slots are available', async () => {
    const onComplete = vi.fn();
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

    render(
      <Step2Time
        serviceId="service-1"
        locationId="location-1"
        durationMinutes={60}
        onComplete={onComplete}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /today/i }));

    const booksyButton = await screen.findByRole('button', { name: /book via booksy/i });
    expect(booksyButton).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /book via booksy/i })).toHaveLength(1);

    openSpy.mockRestore();
  });
});
