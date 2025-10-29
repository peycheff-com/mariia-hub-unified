// Supabase type definitions to avoid using 'any'

export interface Database {
  public: {
    Tables: {
      blog_comments: {
        Row: {
          id: string;
          post_id: string;
          user_id: string;
          parent_id: string | null;
          content: string;
          created_at: string;
          updated_at: string;
          status: 'pending' | 'approved' | 'rejected';
        };
        Insert: Omit<Database['public']['Tables']['blog_comments']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['blog_comments']['Insert']>;
      };
      service_gallery: {
        Row: {
          id: string;
          service_id: string;
          image_url: string;
          caption: string | null;
          display_order: number;
          is_featured: boolean;
          created_at: string;
        };
      };
      services: {
        Row: {
          id: string;
          title: string;
          service_type: 'beauty' | 'fitness' | 'lifestyle';
          category: string | null;
          description: string | null;
          price: number;
          duration_minutes: number | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
      };
    };
  };
}

// Helper types for joins
export interface ServiceGalleryWithService {
  id: string;
  service_id: string;
  image_url: string;
  caption: string | null;
  display_order: number;
  is_featured: boolean;
  created_at: string;
  services: Database['public']['Tables']['services']['Row'];
}

export interface BlogCommentWithProfile {
  id: string;
  content: string;
  created_at: string;
  parent_id: string | null;
  profiles: {
    full_name: string | null;
  };
}

// Supabase client with typing
export interface SupabaseClient {
  from: (table: string) => any;
  auth: {
    getUser: () => Promise<{ data: { user: SupabaseUser | null }, error: any }>;
  };
  channel: (name: string) => any;
  removeChannel: (channel: any) => void;
}

export interface SupabaseUser {
  id: string;
  email?: string;
  user_metadata?: Record<string, any>;
}