import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  generateSmartTimeSlots,
  getQuickTimeOptions,
} from "./timeHeuristics";

const FROZEN_DATE = new Date("2025-01-15T10:00:00.000Z");

describe("time heuristics", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(FROZEN_DATE);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it("prioritizes the soonest slot at the top of the list", () => {

    const slots = generateSmartTimeSlots("beauty", 3);
    const soonest = slots.find(slot => slot.label === "Soonest");

    expect(soonest).toBeDefined();
    expect(slots[0]).toEqual(soonest);
    const expectedHour = (new Date().getHours() + 2) % 24;
    const expectedTime = `${expectedHour.toString().padStart(2, "0")}:00`;
    expect(slots[0]?.time).toBe(expectedTime);
    expect(slots[0]?.priority).toBeGreaterThanOrEqual(slots[1]?.priority ?? 0);
  });

  it("returns today and tomorrow buckets from quick time options", () => {
    vi.setSystemTime(FROZEN_DATE);

    const options = getQuickTimeOptions("fitness");
    const tomorrow = new Date(FROZEN_DATE);
    tomorrow.setDate(tomorrow.getDate() + 1);

    expect(options.soonest?.label).toBe("Soonest");
    expect(options.today).not.toBeNull();
    expect(options.today).toEqual(options.soonest);
    expect(options.today?.date.toDateString()).toBe(FROZEN_DATE.toDateString());

    expect(options.tomorrow).not.toBeNull();
    expect(options.tomorrow?.date.toDateString()).toBe(tomorrow.toDateString());
    expect(options.tomorrow?.label).toBe("Tomorrow");
  });
});
