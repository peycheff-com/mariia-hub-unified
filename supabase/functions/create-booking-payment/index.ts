import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-BOOKING-PAYMENT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    // Use service role key to bypass RLS for booking creation
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const {
      serviceId,
      bookingDate,
      notes,
      priceId,
      amount,
      currency,
      isPackage,
      clientName,
      clientPhone,
      clientEmail,
      languagePreference,
      bookingType,
      durationMinutes,
      locationId,
      selectedAddOns,
      policyAcceptedAt,
      depositAmount,
      balanceDue,
      paymentMethod,
      holdId,
      sessionId,
      onSiteAddress,
    } = await req.json();
    logStep("Request data", { serviceId, bookingDate, priceId, amount, currency, isPackage, bookingType });

    if (!serviceId || !bookingDate) {
      throw new Error("Missing required fields");
    }

    const normalizedAmount =
      amount !== undefined && amount !== null ? Number(amount) : undefined;

    if (!priceId && (normalizedAmount === undefined || Number.isNaN(normalizedAmount))) {
      throw new Error("Either priceId or a valid amount must be provided");
    }

    if (normalizedAmount !== undefined && normalizedAmount <= 0) {
      throw new Error("Amount must be greater than zero");
    }

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Check if Stripe customer exists
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Found existing customer", { customerId });
    } else {
      logStep("No customer found, will create during checkout");
    }

    // Get service details
    const { data: service, error: serviceError } = await supabaseClient
      .from('services')
      .select('*')
      .eq('id', serviceId)
      .single();

    if (serviceError || !service) {
      throw new Error("Service not found");
    }
    logStep("Service found", { serviceTitle: service.title });

    // Validate selected add-ons
    const normalizedSelectedAddOns = Array.isArray(selectedAddOns)
      ? selectedAddOns.map((addon: any) => String(addon))
      : [];
    const serviceAddOns = Array.isArray(service.add_ons) ? (service.add_ons as any[]) : [];
    const serviceAddOnIds = serviceAddOns.map((addon: any) => String(addon.id));
    const invalidAddOns = normalizedSelectedAddOns.filter(
      (addonId) => !serviceAddOnIds.includes(addonId),
    );

    if (invalidAddOns.length > 0) {
      throw new Error("Invalid add-on selection");
    }

    const selectedAddOnDetails = serviceAddOns.filter((addon: any) =>
      normalizedSelectedAddOns.includes(String(addon.id))
    );
    logStep("Add-ons validated", {
      selectedAddOns: normalizedSelectedAddOns,
      resolved: selectedAddOnDetails.map((addon: any) => addon.id),
    });

    // Look up Mariia's resource ID
    const { data: resource, error: resourceError } = await supabaseClient
      .from('resources')
      .select('id, name')
      .eq('name', 'Mariia')
      .eq('is_active', true)
      .limit(1)
      .single();

    if (resourceError || !resource?.id) {
      throw new Error("Resource not configured for Mariia");
    }
    logStep("Resource resolved", { resourceId: resource.id });

    // Validate hold if provided
    let holdSessionId: string | null = sessionId || null;
    if (holdId) {
      const { data: hold, error: holdError } = await supabaseClient
        .from('holds')
        .select('*')
        .eq('id', holdId)
        .single();

      if (holdError || !hold) {
        throw new Error("Hold not found");
      }

      if (hold.user_id && hold.user_id !== user.id) {
        throw new Error("Hold does not belong to the authenticated user");
      }

      if (new Date(hold.expires_at).getTime() <= Date.now()) {
        throw new Error("Hold has expired");
      }

      if (hold.service_id && hold.service_id !== serviceId) {
        throw new Error("Hold does not match the selected service");
      }

      if (hold.resource_id && hold.resource_id !== resource.id) {
        throw new Error("Hold does not match the assigned resource");
      }

      if (hold.session_id && holdSessionId && hold.session_id !== holdSessionId) {
        throw new Error("Hold session mismatch");
      }

      holdSessionId = hold.session_id ?? holdSessionId;
      logStep("Hold validated", { holdId, holdSessionId });
    }

    let normalizedDuration: number | null = null;
    if (durationMinutes !== undefined && durationMinutes !== null) {
      const parsedDuration = Number(durationMinutes);
      if (Number.isNaN(parsedDuration) || parsedDuration <= 0) {
        throw new Error("Invalid duration value");
      }
      normalizedDuration = parsedDuration;
    } else if (service.duration_minutes) {
      normalizedDuration = service.duration_minutes;
    }

    const depositPaid =
      depositAmount !== undefined && depositAmount !== null
        ? Number(depositAmount)
        : 0;
    if (Number.isNaN(depositPaid) || depositPaid < 0) {
      throw new Error("Invalid deposit amount");
    }

    const normalizedBalanceDue =
      balanceDue !== undefined && balanceDue !== null
        ? Number(balanceDue)
        : 0;
    if (Number.isNaN(normalizedBalanceDue) || normalizedBalanceDue < 0) {
      throw new Error("Invalid balance due amount");
    }

    let normalizedPolicyAcceptedAt: string | null = null;
    if (policyAcceptedAt) {
      const parsedPolicyDate = new Date(policyAcceptedAt);
      if (Number.isNaN(parsedPolicyDate.getTime())) {
        throw new Error("Invalid policy acceptance timestamp");
      }
      normalizedPolicyAcceptedAt = parsedPolicyDate.toISOString();
    }

    const normalizedPaymentMethod = paymentMethod ? String(paymentMethod) : null;

    const normalizedLocationId = locationId || null;
    const normalizedOnSiteAddress = onSiteAddress || null;
    const normalizedHoldId = holdId || null;

    // Create pending booking first
    const { data: booking, error: bookingError } = await supabaseClient
      .from('bookings')
      .insert({
        user_id: user.id,
        service_id: serviceId,
        booking_date: bookingDate,
        notes: notes || null,
        client_notes: notes || null,
        client_name: clientName || null,
        client_phone: clientPhone || null,
        client_email: clientEmail || user.email,
        language_preference: languagePreference || 'pl',
        booking_type: bookingType || 'beauty',
        booking_source: 'site',
        mirror_status: bookingType === 'beauty' ? 'pending' : null,
        status: 'pending',
        payment_status: 'pending',
        price_id: priceId,
        is_package: isPackage || false,
        resource_id: resource.id,
        location_id: normalizedLocationId,
        duration_minutes: normalizedDuration,
        selected_add_ons: selectedAddOnDetails,
        deposit_paid: depositPaid,
        balance_due: normalizedBalanceDue,
        policy_accepted_at: normalizedPolicyAcceptedAt,
        payment_method: normalizedPaymentMethod,
        on_site_address: normalizedOnSiteAddress,
        hold_id: normalizedHoldId,
        hold_session_id: holdSessionId,
      })
      .select()
      .single();

    if (bookingError || !booking) {
      logStep("Booking creation error", { error: bookingError });
      throw new Error("Failed to create booking");
    }
    logStep("Booking created", { bookingId: booking.id });

    // Create checkout session with BLIK and P24 support
    // Support both pre-configured prices and dynamic pricing
    const lineItems = priceId
      ? [{ price: priceId, quantity: 1 }]
      : [{
          price_data: {
            currency: currency || 'pln',
            unit_amount: Math.round((normalizedAmount ?? 0) * 100), // Convert to cents
            product_data: {
              name: service.title,
              description: service.description || undefined,
            },
          },
          quantity: 1,
        }];

    const origin = req.headers.get("origin") || Deno.env.get("SITE_URL") || "";

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: lineItems,
      mode: "payment",
      payment_method_types: ['card', 'blik', 'p24'],
      success_url: `${origin}/success?payment=success&session_id={CHECKOUT_SESSION_ID}&booking_id=${booking.id}`,
      cancel_url: `${origin}/`,
      metadata: {
        booking_id: booking.id,
        user_id: user.id,
        service_id: serviceId,
        is_package: isPackage ? 'true' : 'false',
        booking_type: bookingType || 'beauty',
      },
      locale: languagePreference || 'pl',
    });

    logStep("Checkout session created", { sessionId: session.id });

    // Update booking with session ID
    await supabaseClient
      .from('bookings')
      .update({
        stripe_checkout_session_id: session.id,
      })
      .eq('id', booking.id);

    return new Response(JSON.stringify({ 
      url: session.url,
      sessionId: session.id,
      bookingId: booking.id,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: "Failed to process payment request" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
