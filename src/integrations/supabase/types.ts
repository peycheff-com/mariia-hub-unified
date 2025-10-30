export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      availability_slots: {
        Row: {
          capacity: number | null
          created_at: string | null
          current_bookings: number | null
          date: string
          end_time: string
          id: string
          is_available: boolean | null
          location_type: Database["public"]["Enums"]["location_type"] | null
          notes: string | null
          service_id: string
          start_time: string
          updated_at: string | null
        }
        Insert: {
          capacity?: number | null
          created_at?: string | null
          current_bookings?: number | null
          date: string
          end_time: string
          id?: string
          is_available?: boolean | null
          location_type?: Database["public"]["Enums"]["location_type"] | null
          notes?: string | null
          service_id: string
          start_time: string
          updated_at?: string | null
        }
        Update: {
          capacity?: number | null
          created_at?: string | null
          current_bookings?: number | null
          date?: string
          end_time?: string
          id?: string
          is_available?: boolean | null
          location_type?: Database["public"]["Enums"]["location_type"] | null
          notes?: string | null
          service_id?: string
          start_time?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "availability_slots_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_drafts: {
        Row: {
          booking_date: string | null
          booking_time: string | null
          client_data: Json | null
          created_at: string | null
          current_step: number | null
          expires_at: string | null
          id: string
          notes: string | null
          selected_date: string | null
          selected_time: string | null
          service_id: string | null
          service_type: Database["public"]["Enums"]["service_type"] | null
          session_id: string
          step_completed: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          booking_date?: string | null
          booking_time?: string | null
          client_data?: Json | null
          created_at?: string | null
          current_step?: number | null
          expires_at?: string | null
          id?: string
          notes?: string | null
          selected_date?: string | null
          selected_time?: string | null
          service_id?: string | null
          service_type?: Database["public"]["Enums"]["service_type"] | null
          session_id: string
          step_completed?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          booking_date?: string | null
          booking_time?: string | null
          client_data?: Json | null
          created_at?: string | null
          current_step?: number | null
          expires_at?: string | null
          id?: string
          notes?: string | null
          selected_date?: string | null
          selected_time?: string | null
          service_id?: string | null
          service_type?: Database["public"]["Enums"]["service_type"] | null
          session_id?: string
          step_completed?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "booking_drafts_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          booking_data: Json | null
          booking_date: string
          client_email: string
          client_name: string
          client_phone: string | null
          created_at: string | null
          currency: string
          deposit_amount: number | null
          end_time: string
          external_booking_id: string | null
          external_source: string | null
          id: string
          location_type: Database["public"]["Enums"]["location_type"] | null
          metadata: Json | null
          notes: string | null
          payment_status: Database["public"]["Enums"]["payment_status"] | null
          preferences: Json | null
          service_id: string
          start_time: string
          status: Database["public"]["Enums"]["booking_status"] | null
          stripe_payment_intent_id: string | null
          total_amount: number
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          booking_data?: Json | null
          booking_date: string
          client_email: string
          client_name: string
          client_phone?: string | null
          created_at?: string | null
          currency?: string
          deposit_amount?: number | null
          end_time: string
          external_booking_id?: string | null
          external_source?: string | null
          id?: string
          location_type?: Database["public"]["Enums"]["location_type"] | null
          metadata?: Json | null
          notes?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"] | null
          preferences?: Json | null
          service_id: string
          start_time: string
          status?: Database["public"]["Enums"]["booking_status"] | null
          stripe_payment_intent_id?: string | null
          total_amount: number
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          booking_data?: Json | null
          booking_date?: string
          client_email?: string
          client_name?: string
          client_phone?: string | null
          created_at?: string | null
          currency?: string
          deposit_amount?: number | null
          end_time?: string
          external_booking_id?: string | null
          external_source?: string | null
          id?: string
          location_type?: Database["public"]["Enums"]["location_type"] | null
          metadata?: Json | null
          notes?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"] | null
          preferences?: Json | null
          service_id?: string
          start_time?: string
          status?: Database["public"]["Enums"]["booking_status"] | null
          stripe_payment_intent_id?: string | null
          total_amount?: number
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      holds: {
        Row: {
          created_at: string | null
          date: string
          expires_at: string
          id: string
          service_id: string
          session_id: string
          time_slot: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          date: string
          expires_at?: string
          id?: string
          service_id: string
          session_id: string
          time_slot: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          date?: string
          expires_at?: string
          id?: string
          service_id?: string
          session_id?: string
          time_slot?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "holds_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          preferences: Json | null
          role: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          preferences?: Json | null
          role?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          preferences?: Json | null
          role?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      reviews: {
        Row: {
          booking_id: string | null
          content: string | null
          created_at: string | null
          helpful_count: number | null
          id: string
          is_public: boolean | null
          is_verified: boolean | null
          rating: number
          responded_at: string | null
          response_text: string | null
          service_id: string
          title: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          booking_id?: string | null
          content?: string | null
          created_at?: string | null
          helpful_count?: number | null
          id?: string
          is_public?: boolean | null
          is_verified?: boolean | null
          rating: number
          responded_at?: string | null
          response_text?: string | null
          service_id: string
          title?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          booking_id?: string | null
          content?: string | null
          created_at?: string | null
          helpful_count?: number | null
          id?: string
          is_public?: boolean | null
          is_verified?: boolean | null
          rating?: number
          responded_at?: string | null
          response_text?: string | null
          service_id?: string
          title?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      service_content: {
        Row: {
          content: string
          content_type: string
          created_at: string | null
          id: string
          order_index: number | null
          service_id: string
          title: string
          updated_at: string | null
        }
        Insert: {
          content: string
          content_type: string
          created_at?: string | null
          id?: string
          order_index?: number | null
          service_id: string
          title: string
          updated_at?: string | null
        }
        Update: {
          content?: string
          content_type?: string
          created_at?: string | null
          id?: string
          order_index?: number | null
          service_id?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_content_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      service_gallery: {
        Row: {
          caption: string | null
          created_at: string | null
          id: string
          image_url: string
          is_active: boolean | null
          order_index: number | null
          service_id: string
          updated_at: string | null
        }
        Insert: {
          caption?: string | null
          created_at?: string | null
          id?: string
          image_url: string
          is_active?: boolean | null
          order_index?: number | null
          service_id: string
          updated_at?: string | null
        }
        Update: {
          caption?: string | null
          created_at?: string | null
          id?: string
          image_url?: string
          is_active?: boolean | null
          order_index?: number | null
          service_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_gallery_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          buffer_minutes: number | null
          category: string | null
          created_at: string | null
          currency: string
          deposit_percentage: number | null
          description: string | null
          duration_minutes: number
          id: string
          images: string[] | null
          is_active: boolean | null
          location_type: Database["public"]["Enums"]["location_type"] | null
          max_capacity: number | null
          metadata: Json | null
          price: number
          requires_deposit: boolean | null
          service_type: Database["public"]["Enums"]["service_type"]
          tags: string[] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          buffer_minutes?: number | null
          category?: string | null
          created_at?: string | null
          currency?: string
          deposit_percentage?: number | null
          description?: string | null
          duration_minutes: number
          id?: string
          images?: string[] | null
          is_active?: boolean | null
          location_type?: Database["public"]["Enums"]["location_type"] | null
          max_capacity?: number | null
          metadata?: Json | null
          price: number
          requires_deposit?: boolean | null
          service_type: Database["public"]["Enums"]["service_type"]
          tags?: string[] | null
          title: string
          updated_at?: string | null
        }
        Update: {
          buffer_minutes?: number | null
          category?: string | null
          created_at?: string | null
          currency?: string
          deposit_percentage?: number | null
          description?: string | null
          duration_minutes?: number
          id?: string
          images?: string[] | null
          is_active?: boolean | null
          location_type?: Database["public"]["Enums"]["location_type"] | null
          max_capacity?: number | null
          metadata?: Json | null
          price?: number
          requires_deposit?: boolean | null
          service_type?: Database["public"]["Enums"]["service_type"]
          tags?: string[] | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: { Args: { role: string; user_id: string }; Returns: boolean }
    }
    Enums: {
      booking_status:
        | "draft"
        | "pending"
        | "confirmed"
        | "cancelled"
        | "completed"
        | "no_show"
        | "rescheduled"
      location_type: "studio" | "mobile" | "online" | "salon"
      payment_status:
        | "pending"
        | "paid"
        | "refunded"
        | "partially_refunded"
        | "failed"
      service_type: "beauty" | "fitness" | "lifestyle"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      booking_status: [
        "draft",
        "pending",
        "confirmed",
        "cancelled",
        "completed",
        "no_show",
        "rescheduled",
      ],
      location_type: ["studio", "mobile", "online", "salon"],
      payment_status: [
        "pending",
        "paid",
        "refunded",
        "partially_refunded",
        "failed",
      ],
      service_type: ["beauty", "fitness", "lifestyle"],
    },
  },
} as const

