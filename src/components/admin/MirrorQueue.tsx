import { useState, useEffect } from "react";
import { ExternalLink, Clock, CheckCircle2, AlertCircle, Copy } from "lucide-react";
import { format } from "date-fns";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

interface MirrorBooking {
  id: string;
  client_name: string;
  client_phone: string;
  client_email: string;
  booking_date: string;
  booking_type: string;
  service_id: string;
  mirror_status: string;
  mirror_notes: string | null;
  payment_status: string;
  amount_paid: number | null;
  currency: string;
  created_at: string;
  mirrored_at: string | null;
  booksy_appointment_id: string | null;
  language_preference: string | null;
  services: {
    title: string;
    service_type: string;
    duration_minutes: number;
  } | null;
}

const MirrorQueue = () => {
  const [bookings, setBookings] = useState<MirrorBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingNotes, setEditingNotes] = useState<{ [key: string]: string }>({});
  const { toast } = useToast();

  const loadBookings = async () => {
    try {
      const { data, error } = await supabase
        .from("bookings")
        .select(`
          *,
          services (
            title,
            service_type,
            duration_minutes
          )
        `)
        .eq("booking_type", "beauty")
        .in("mirror_status", ["pending", "mirrored", "attention"])
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      setBookings(data || []);
    } catch (error: any) {
      toast({
        title: "Error loading bookings",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();

    const channel = supabase
      .channel("mirror-queue-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "bookings",
        },
        () => {
          loadBookings();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const updateMirrorStatus = async (
    bookingId: string,
    status: string,
    notes?: string
  ) => {
    try {
      // Get booking details first
      const { data: booking, error: fetchError } = await supabase
        .from("bookings")
        .select(`
          *,
          services (
            id,
            service_type,
            duration_minutes
          )
        `)
        .eq("id", bookingId)
        .single();

      if (fetchError) throw fetchError;

      const updates: any = {
        mirror_status: status,
      };

      if (status === "mirrored") {
        updates.mirrored_at = new Date().toISOString();
        updates.mirrored_by = (await supabase.auth.getUser()).data.user?.id;
        updates.status = "confirmed"; // Confirm the booking when mirrored
      }

      if (notes !== undefined) {
        updates.mirror_notes = notes;
      }

      const { error } = await supabase
        .from("bookings")
        .update(updates)
        .eq("id", bookingId);

      if (error) throw error;

      // Log event
      await supabase.rpc("log_booking_event", {
        p_booking_id: bookingId,
        p_event_type: status === "mirrored" ? "mirrored" : "confirmed",
        p_notes: notes,
      });

      // Update analytics when booking is confirmed/mirrored
      if (status === "mirrored" && booking?.services) {
        const bookingDate = new Date(booking.booking_date);
        const dayOfWeek = bookingDate.getDay();
        const timeSlot = bookingDate.toTimeString().slice(0, 5); // HH:MM format

        // Update service analytics
        const { data: existingServiceAnalytics } = await supabase
          .from("service_analytics")
          .select("*")
          .eq("service_id", booking.service_id)
          .maybeSingle();

        if (existingServiceAnalytics) {
          await supabase
            .from("service_analytics")
            .update({
              booking_count: existingServiceAnalytics.booking_count + 1,
              last_updated: new Date().toISOString(),
            })
            .eq("id", existingServiceAnalytics.id);
        } else {
          await supabase.from("service_analytics").insert({
            service_id: booking.service_id,
            service_type: booking.services.service_type,
            booking_count: 1,
            view_count: 0,
          });
        }

        // Update time slot analytics
        const { data: existingTimeSlot } = await supabase
          .from("time_slot_analytics")
          .select("*")
          .eq("time_slot", timeSlot)
          .eq("day_of_week", dayOfWeek)
          .eq("service_type", booking.services.service_type)
          .maybeSingle();

        if (existingTimeSlot) {
          await supabase
            .from("time_slot_analytics")
            .update({
              booking_count: existingTimeSlot.booking_count + 1,
              last_updated: new Date().toISOString(),
            })
            .eq("id", existingTimeSlot.id);
        } else {
          await supabase.from("time_slot_analytics").insert({
            time_slot: timeSlot,
            day_of_week: dayOfWeek,
            service_type: booking.services.service_type,
            booking_count: 1,
          });
        }
      }

      toast({
        title: "Status updated",
        description: `Booking marked as ${status}${status === "mirrored" ? " and confirmed" : ""}`,
      });

      loadBookings();
    } catch (error: any) {
      toast({
        title: "Error updating status",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const saveNotes = async (bookingId: string) => {
    const notes = editingNotes[bookingId];
    await updateMirrorStatus(bookingId, "attention", notes);
    setEditingNotes((prev) => {
      const newState = { ...prev };
      delete newState[bookingId];
      return newState;
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: "Information copied successfully",
    });
  };

  const getBooksyUrl = (booking: MirrorBooking) => {
    const date = format(new Date(booking.booking_date), "yyyy-MM-dd");
    return `https://biz.booksy.com/pl/calendar?date=${date}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400";
      case "mirrored":
        return "bg-green-500/10 text-green-700 dark:text-green-400";
      case "attention":
        return "bg-red-500/10 text-red-700 dark:text-red-400";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const renderBookingCard = (booking: MirrorBooking) => (
    <Card key={booking.id} className="p-6 space-y-4 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between">
        <div className="space-y-1 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-lg">{booking.services?.title}</h3>
            <Badge variant="outline" className={getStatusColor(booking.mirror_status)}>
              {booking.mirror_status}
            </Badge>
            {booking.booksy_appointment_id && (
              <Badge variant="outline" className="bg-blue-500/10 text-blue-700 dark:text-blue-400">
                Booksy: {booking.booksy_appointment_id}
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {format(new Date(booking.booking_date), "PPP 'at' p")}
          </p>
          <p className="text-xs text-muted-foreground">
            Booking ID: {booking.id.slice(0, 8)}...
          </p>
        </div>
        <div className="text-right">
          <p className="font-semibold text-lg">
            {booking.amount_paid} {booking.currency?.toUpperCase()}
          </p>
          <Badge 
            variant="outline" 
            className={`mt-1 ${
              booking.payment_status === 'paid' 
                ? 'bg-green-500/10 text-green-700 dark:text-green-400' 
                : 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400'
            }`}
          >
            {booking.payment_status}
          </Badge>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4 text-sm bg-muted/30 rounded-lg p-4">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase text-muted-foreground">Client Information</p>
          <div>
            <p className="font-medium">{booking.client_name}</p>
          </div>
          <div className="flex items-center gap-2">
            <a 
              href={`tel:${booking.client_phone}`}
              className="text-xs text-primary hover:underline"
            >
              {booking.client_phone}
            </a>
            <Button
              variant="ghost"
              size="sm"
              className="h-5 w-5 p-0"
              onClick={() => copyToClipboard(booking.client_phone)}
            >
              <Copy className="h-3 w-3" />
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <a 
              href={`mailto:${booking.client_email}`}
              className="text-xs text-primary hover:underline truncate"
            >
              {booking.client_email}
            </a>
            <Button
              variant="ghost"
              size="sm"
              className="h-5 w-5 p-0 flex-shrink-0"
              onClick={() => copyToClipboard(booking.client_email)}
            >
              <Copy className="h-3 w-3" />
            </Button>
          </div>
        </div>
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase text-muted-foreground">Service Details</p>
          <div className="space-y-1">
            <p className="text-xs">
              <span className="font-medium">Duration:</span> {booking.services?.duration_minutes} min
            </p>
            <p className="text-xs">
              <span className="font-medium">Created:</span> {format(new Date(booking.created_at), "PPp")}
            </p>
            {booking.mirrored_at && (
              <p className="text-xs text-green-600 dark:text-green-400">
                <span className="font-medium">Mirrored:</span> {format(new Date(booking.mirrored_at), "PPp")}
              </p>
            )}
            {booking.language_preference && (
              <p className="text-xs">
                <span className="font-medium">Language:</span> {booking.language_preference.toUpperCase()}
              </p>
            )}
          </div>
        </div>
      </div>

      {booking.mirror_notes && (
        <div className="p-3 bg-muted rounded-lg">
          <p className="text-sm font-medium mb-1">Notes:</p>
          <p className="text-sm text-muted-foreground">{booking.mirror_notes}</p>
        </div>
      )}

      {editingNotes[booking.id] !== undefined ? (
        <div className="space-y-2">
          <Textarea
            value={editingNotes[booking.id]}
            onChange={(e) =>
              setEditingNotes((prev) => ({
                ...prev,
                [booking.id]: e.target.value,
              }))
            }
            placeholder="Add notes..."
            rows={2}
          />
          <div className="flex gap-2">
            <Button onClick={() => saveNotes(booking.id)} size="sm">
              Save Notes
            </Button>
            <Button
              onClick={() =>
                setEditingNotes((prev) => {
                  const newState = { ...prev };
                  delete newState[booking.id];
                  return newState;
                })
              }
              variant="outline"
              size="sm"
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex gap-2 flex-wrap">
          {booking.mirror_status === "pending" && (
            <>
              <Button
                onClick={() => updateMirrorStatus(booking.id, "mirrored")}
                size="sm"
                className="gap-2"
              >
                <CheckCircle2 className="h-4 w-4" />
                Mark Mirrored
              </Button>
              <Button
                onClick={() =>
                  setEditingNotes((prev) => ({
                    ...prev,
                    [booking.id]: booking.mirror_notes || "",
                  }))
                }
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <AlertCircle className="h-4 w-4" />
                Flag Issue
              </Button>
            </>
          )}
          <Button
            onClick={() => window.open(getBooksyUrl(booking), "_blank")}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <ExternalLink className="h-4 w-4" />
            Open Booksy
          </Button>
        </div>
      )}
    </Card>
  );

  const pendingBookings = bookings.filter((b) => !b.mirror_status || b.mirror_status === "pending");
  const mirroredBookings = bookings.filter((b) => b.mirror_status === "mirrored");
  const attentionBookings = bookings.filter((b) => b.mirror_status === "attention");

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Clock className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Booksy Mirror Queue</h2>
          <p className="text-sm text-muted-foreground">
            Beauty bookings pending Booksy sync
          </p>
        </div>
        <Button onClick={loadBookings} variant="outline" size="sm">
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pending">
            New ({pendingBookings.length})
          </TabsTrigger>
          <TabsTrigger value="mirrored">
            Mirrored ({mirroredBookings.length})
          </TabsTrigger>
          <TabsTrigger value="attention">
            Attention ({attentionBookings.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4 mt-6">
          {pendingBookings.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">No pending bookings</p>
            </Card>
          ) : (
            pendingBookings.map(renderBookingCard)
          )}
        </TabsContent>

        <TabsContent value="mirrored" className="space-y-4 mt-6">
          {mirroredBookings.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">No mirrored bookings</p>
            </Card>
          ) : (
            mirroredBookings.map(renderBookingCard)
          )}
        </TabsContent>

        <TabsContent value="attention" className="space-y-4 mt-6">
          {attentionBookings.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">No bookings needing attention</p>
            </Card>
          ) : (
            attentionBookings.map(renderBookingCard)
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MirrorQueue;
