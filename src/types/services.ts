// Service-related type definitions
export interface ServiceDetail {
  id: string;
  title: string;
  slug: string;
  description: string;
  service_type: 'beauty' | 'fitness' | 'lifestyle';
  category: string;
  duration_minutes: number;
  price_from: number;
  price_to?: number;
  active: boolean;
  is_active?: boolean;
  display_order?: number;
  image_url?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ServiceGallery {
  id: string;
  service_id: string;
  image_url: string;
  caption?: string;
  order: number;
  created_at?: string;
  updated_at?: string;
}

export interface ServiceFAQ {
  id: string;
  service_id: string;
  question: string;
  answer: string;
  order: number;
  created_at?: string;
  updated_at?: string;
}

export interface ServiceContent {
  id: string;
  service_id: string;
  content_type: 'preparation' | 'aftercare' | 'what_to_expect' | 'contraindications';
  title: string;
  content: string;
  order: number;
  created_at?: string;
  updated_at?: string;
}

export interface ServiceReview {
  id: string;
  service_id: string;
  rating: number;
  review: string;
  reviewer_name: string;
  reviewer_email?: string;
  approved: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ServiceWithRelations extends ServiceDetail {
  gallery?: ServiceGallery[];
  faqs?: ServiceFAQ[];
  content?: ServiceContent[];
  reviews?: ServiceReview[];
}