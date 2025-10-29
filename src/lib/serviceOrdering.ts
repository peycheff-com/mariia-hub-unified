// Service ordering and prioritization logic

import { supabase } from "@/integrations/supabase/client";

import { getTimeOfDay } from "./timeHeuristics";

export interface Service {
  id: string;
  name: string;
  type: "beauty" | "fitness" | "lifestyle";
  description?: string;
  priority?: number;
}

export const trackServiceView = async (serviceId: string, serviceType: "beauty" | "fitness" | "lifestyle") => {
  const hour = new Date().getHours();
  const timeOfDay = getTimeOfDay(hour);

  try {
    // Increment view count
    const { data: existing } = await supabase
      .from("service_analytics")
      .select("*")
      .eq("service_id", serviceId)
      .eq("time_of_day", timeOfDay)
      .single();

    if (existing) {
      await supabase
        .from("service_analytics")
        .update({
          view_count: existing.view_count + 1,
          last_updated: new Date().toISOString(),
        })
        .eq("id", existing.id);
    } else {
      await supabase.from("service_analytics").insert({
        service_id: serviceId,
        service_type: serviceType,
        time_of_day: timeOfDay,
        view_count: 1,
      });
    }
  } catch (error) {
    // Service view tracking failed silently
  }
};

export const trackServiceBooking = async (serviceId: string, serviceType: "beauty" | "fitness" | "lifestyle") => {
  const hour = new Date().getHours();
  const timeOfDay = getTimeOfDay(hour);

  try {
    const { data: existing } = await supabase
      .from("service_analytics")
      .select("*")
      .eq("service_id", serviceId)
      .eq("time_of_day", timeOfDay)
      .single();

    if (existing) {
      await supabase
        .from("service_analytics")
        .update({
          booking_count: existing.booking_count + 1,
          last_updated: new Date().toISOString(),
        })
        .eq("id", existing.id);
    } else {
      await supabase.from("service_analytics").insert({
        service_id: serviceId,
        service_type: serviceType,
        time_of_day: timeOfDay,
        booking_count: 1,
      });
    }
  } catch (error) {
    // Service booking tracking failed silently
  }
};

export const getOrderedServices = async <T extends Service>(
  services: T[],
  serviceType: "beauty" | "fitness" | "lifestyle"
): Promise<T[]> => {
  const hour = new Date().getHours();
  const timeOfDay = getTimeOfDay(hour);

  try {
    // Get analytics for current time of day
    const { data: analytics } = await supabase
      .from("service_analytics")
      .select("*")
      .eq("service_type", serviceType)
      .eq("time_of_day", timeOfDay);

    if (!analytics || analytics.length === 0) {
      return services; // Return original order if no analytics
    }

    // Create priority map
    const priorityMap = new Map<string, number>();
    analytics.forEach(item => {
      // Weight bookings more than views (2:1 ratio)
      const score = (item.booking_count * 2) + item.view_count;
      priorityMap.set(item.service_id, score);
    });

    // Sort services by analytics score
    return [...services].sort((a, b) => {
      const scoreA = priorityMap.get(a.id) || 0;
      const scoreB = priorityMap.get(b.id) || 0;
      return scoreB - scoreA;
    });
  } catch (error) {
    // Service ordering failed, return original order
    return services;
  }
};
