// Time slot heuristics for smart booking

export interface TimeSlot {
  date: Date;
  time: string;
  label?: string;
  priority: number;
}

export const getTimeOfDay = (hour: number): "morning" | "afternoon" | "evening" => {
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
};

export const generateSmartTimeSlots = (
  serviceType: "beauty" | "fitness",
  daysAhead: number = 14
): TimeSlot[] => {
  const slots: TimeSlot[] = [];
  const now = new Date();
  const currentHour = now.getHours();

  // Define business hours
  const startHour = 7;
  const endHour = 22;
  const slotDuration = 60; // minutes

  // Generate slots for next 14 days
  for (let dayOffset = 0; dayOffset < daysAhead; dayOffset++) {
    const date = new Date(now);
    date.setDate(date.getDate() + dayOffset);
    
    const isToday = dayOffset === 0;
    const isTomorrow = dayOffset === 1;
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;

    for (let hour = startHour; hour < endHour; hour++) {
      // Skip past hours for today
      if (isToday && hour <= currentHour + 1) continue;

      const time = `${hour.toString().padStart(2, "0")}:00`;
      const timeOfDay = getTimeOfDay(hour);
      
      // Calculate priority based on heuristics
      let priority = 50; // base priority

      // Soonest gets highest priority
      if (isToday && hour === currentHour + 2) priority = 100;
      if (isTomorrow) priority += 20;

      // Service-specific preferences
      if (serviceType === "beauty") {
        // Beauty: mornings and early afternoons are popular
        if (timeOfDay === "morning") priority += 15;
        if (timeOfDay === "afternoon" && hour < 15) priority += 10;
        // Weekends get boost
        if (isWeekend) priority += 10;
      } else {
        // Fitness: evenings are popular
        if (timeOfDay === "evening" && hour >= 17 && hour <= 20) priority += 20;
        if (timeOfDay === "morning" && hour >= 7 && hour <= 9) priority += 15;
        // Weekday mornings and evenings
        if (!isWeekend && (hour === 7 || hour === 18 || hour === 19)) priority += 10;
      }

      // Saturday morning boost
      if (date.getDay() === 6 && hour >= 9 && hour <= 12) priority += 15;

      let label: string | undefined;
      if (isToday && hour === currentHour + 2) label = "Soonest";
      if (isToday) label = label || "Today";
      if (isTomorrow) label = "Tomorrow";
      if (date.getDay() === 6) label = label || "Saturday";

      slots.push({
        date,
        time,
        label,
        priority,
      });
    }
  }

  // Sort by priority (highest first)
  return slots.sort((a, b) => b.priority - a.priority);
};

export const getTopTimeSlots = (
  serviceType: "beauty" | "fitness",
  count: number = 6
): TimeSlot[] => {
  const allSlots = generateSmartTimeSlots(serviceType);
  return allSlots.slice(0, count);
};

export const getQuickTimeOptions = (serviceType: "beauty" | "fitness") => {
  const slots = generateSmartTimeSlots(serviceType);
  const now = new Date();
  const today = slots.filter(s => 
    s.date.toDateString() === now.toDateString()
  );
  const tomorrow = slots.filter(s => {
    const tom = new Date(now);
    tom.setDate(tom.getDate() + 1);
    return s.date.toDateString() === tom.toDateString();
  });

  return {
    soonest: slots[0],
    today: today.length > 0 ? today[0] : null,
    tomorrow: tomorrow.length > 0 ? tomorrow[0] : null,
  };
};
