export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface ContentTables {
  services: {
    Row: {
      add_ons: Json | null
      allows_groups: boolean | null
      capacity_settings: Json | null
      category: string | null
      contraindications: string[] | null
      created_at: string
      deposit_amount: number | null
      deposit_percentage: number | null
      description: string
      display_order: number | null
      duration_minutes: number | null
      features: string[] | null
      id: string
      image_url: string | null
      is_active: boolean | null
      is_package: boolean | null
      location_rules: Json | null
      max_group_size: number | null
      metadata: Json | null
      package_sessions: number | null
      price_from: number | null
      price_to: number | null
      requires_policy_acceptance: boolean | null
      service_type: Database["public"]["Enums"]["service_type"]
      slug: string
      stripe_price_id: string | null
      title: string
      translations: Json | null
      updated_at: string
    }
    Insert: {
      add_ons?: Json | null
      allows_groups?: boolean | null
      capacity_settings?: Json | null
      category?: string | null
      contraindications?: string[] | null
      created_at?: string
      deposit_amount?: number | null
      deposit_percentage?: number | null
      description: string
      display_order?: number | null
      duration_minutes?: number | null
      features?: string[] | null
      id?: string
      image_url?: string | null
      is_active?: boolean | null
      is_package?: boolean | null
      location_rules?: Json | null
      max_group_size?: number | null
      metadata?: Json | null
      package_sessions?: number | null
      price_from?: number | null
      price_to?: number | null
      requires_policy_acceptance?: boolean | null
      service_type?: Database["public"]["Enums"]["service_type"]
      slug: string
      stripe_price_id?: string | null
      title: string
      translations?: Json | null
      updated_at?: string
    }
    Update: {
      add_ons?: Json | null
      allows_groups?: boolean | null
      capacity_settings?: Json | null
      category?: string | null
      contraindications?: string[] | null
      created_at?: string
      deposit_amount?: number | null
      deposit_percentage?: number | null
      description?: string
      display_order?: number | null
      duration_minutes?: number | null
      features?: string[] | null
      id?: string
      image_url?: string | null
      is_active?: boolean | null
      is_package?: boolean | null
      location_rules?: Json | null
      max_group_size?: number | null
      metadata?: Json | null
      package_sessions?: number | null
      price_from?: number | null
      price_to?: number | null
      requires_policy_acceptance?: boolean | null
      service_type?: Database["public"]["Enums"]["service_type"]
      slug?: string
      stripe_price_id?: string | null
      title?: string
      translations?: Json | null
      updated_at?: string
    }
    Relationships: []
  }

  service_content: {
    Row: {
      id: string
      service_id: string
      content_type: 'preparation' | 'aftercare' | 'expectations' | 'benefits' | 'risks' | 'faq'
      title: string
      content: string
      display_order: number
      is_active: boolean
      created_at: string
      updated_at: string
    }
    Insert: {
      id?: string
      service_id: string
      content_type: 'preparation' | 'aftercare' | 'expectations' | 'benefits' | 'risks' | 'faq'
      title: string
      content: string
      display_order?: number
      is_active?: boolean
      created_at?: string
      updated_at?: string
    }
    Update: {
      id?: string
      service_id?: string
      content_type?: 'preparation' | 'aftercare' | 'expectations' | 'benefits' | 'risks' | 'faq'
      title?: string
      content?: string
      display_order?: number
      is_active?: boolean
      updated_at?: string
    }
    Relationships: []
  }

  service_gallery: {
    Row: {
      id: string
      service_id: string
      image_url: string
      caption: string | null
      display_order: number
      is_active: boolean
      created_at: string
      updated_at: string
    }
    Insert: {
      id?: string
      service_id: string
      image_url: string
      caption?: string | null
      display_order?: number
      is_active?: boolean
      created_at?: string
      updated_at?: string
    }
    Update: {
      id?: string
      service_id?: string
      image_url?: string
      caption?: string | null
      display_order?: number
      is_active?: boolean
      updated_at?: string
    }
    Relationships: []
  }

  service_faqs: {
    Row: {
      id: string
      service_id: string
      question: string
      answer: string
      display_order: number
      is_active: boolean
      created_at: string
      updated_at: string
    }
    Insert: {
      id?: string
      service_id: string
      question: string
      answer: string
      display_order?: number
      is_active?: boolean
      created_at?: string
      updated_at?: string
    }
    Update: {
      id?: string
      service_id?: string
      question?: string
      answer?: string
      display_order?: number
      is_active?: boolean
      updated_at?: string
    }
    Relationships: []
  }

  blog_posts: {
    Row: {
      id: string
      title: string
      slug: string
      excerpt: string | null
      content: string
      featured_image: string | null
      category_id: string | null
      author_id: string | null
      status: 'draft' | 'published' | 'archived'
      published_at: string | null
      seo_title: string | null
      seo_description: string | null
      tags: string[]
      view_count: number
      is_featured: boolean
      created_at: string
      updated_at: string
    }
    Insert: {
      id?: string
      title: string
      slug: string
      excerpt?: string | null
      content: string
      featured_image?: string | null
      category_id?: string | null
      author_id?: string | null
      status?: 'draft' | 'published' | 'archived'
      published_at?: string | null
      seo_title?: string | null
      seo_description?: string | null
      tags?: string[]
      view_count?: number
      is_featured?: boolean
      created_at?: string
      updated_at?: string
    }
    Update: {
      id?: string
      title?: string
      slug?: string
      excerpt?: string | null
      content?: string
      featured_image?: string | null
      category_id?: string | null
      author_id?: string | null
      status?: 'draft' | 'published' | 'archived'
      published_at?: string | null
      seo_title?: string | null
      seo_description?: string | null
      tags?: string[]
      view_count?: number
      is_featured?: boolean
      updated_at?: string
    }
    Relationships: []
  }

  blog_categories: {
    Row: {
      id: string
      name: string
      slug: string
      description: string | null
      parent_id: string | null
      display_order: number
      is_active: boolean
      created_at: string
      updated_at: string
    }
    Insert: {
      id?: string
      name: string
      slug: string
      description?: string | null
      parent_id?: string | null
      display_order?: number
      is_active?: boolean
      created_at?: string
      updated_at?: string
    }
    Update: {
      id?: string
      name?: string
      slug?: string
      description?: string | null
      parent_id?: string | null
      display_order?: number
      is_active?: boolean
      updated_at?: string
    }
    Relationships: []
  }

  blog_comments: {
    Row: {
      id: string
      post_id: string
      author_name: string
      author_email: string
      author_website: string | null
      content: string
      parent_id: string | null
      status: 'pending' | 'approved' | 'rejected' | 'spam'
      created_at: string
      updated_at: string
    }
    Insert: {
      id?: string
      post_id: string
      author_name: string
      author_email: string
      author_website?: string | null
      content: string
      parent_id?: string | null
      status?: 'pending' | 'approved' | 'rejected' | 'spam'
      created_at?: string
      updated_at?: string
    }
    Update: {
      id?: string
      post_id?: string
      author_name?: string
      author_email?: string
      author_website?: string | null
      content?: string
      parent_id?: string | null
      status?: 'pending' | 'approved' | 'rejected' | 'spam'
      updated_at?: string
    }
    Relationships: []
  }

  social_posts: {
    Row: {
      id: string
      platform: string
      platform_post_id: string
      content: string
      media_urls: string[]
      posted_at: string
      metrics: Json
      status: 'draft' | 'scheduled' | 'posted' | 'failed'
      created_at: string
      updated_at: string
    }
    Insert: {
      id?: string
      platform: string
      platform_post_id: string
      content: string
      media_urls?: string[]
      posted_at?: string
      metrics?: Json
      status?: 'draft' | 'scheduled' | 'posted' | 'failed'
      created_at?: string
      updated_at?: string
    }
    Update: {
      id?: string
      platform?: string
      platform_post_id?: string
      content?: string
      media_urls?: string[]
      posted_at?: string
      metrics?: Json
      status?: 'draft' | 'scheduled' | 'posted' | 'failed'
      updated_at?: string
    }
    Relationships: []
  }

  site_images: {
    Row: {
      id: string
      filename: string
      original_filename: string
      file_path: string
      file_url: string
      file_size: number
      mime_type: string
      width: number | null
      height: number | null
      alt_text: string | null
      caption: string | null
      tags: string[]
      metadata: Json
      created_at: string
      updated_at: string
    }
    Insert: {
      id?: string
      filename: string
      original_filename: string
      file_path: string
      file_url: string
      file_size: number
      mime_type: string
      width?: number | null
      height?: number | null
      alt_text?: string | null
      caption?: string | null
      tags?: string[]
      metadata?: Json
      created_at?: string
      updated_at?: string
    }
    Update: {
      id?: string
      filename?: string
      original_filename?: string
      file_path?: string
      file_url?: string
      file_size?: number
      mime_type?: string
      width?: number | null
      height?: number | null
      alt_text?: string | null
      caption?: string | null
      tags?: string[]
      metadata?: Json
      updated_at?: string
    }
    Relationships: []
  }
}

// Type imports for database dependencies
interface Database {
  public: {
    Enums: {
      service_type: any
    }
  }
}