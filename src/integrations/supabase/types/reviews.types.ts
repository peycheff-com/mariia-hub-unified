export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface ReviewsTables {
  reviews: {
    Row: {
      id: string
      service_id: string
      user_id: string | null
      rating: number
      title: string | null
      content: string
      pros: string[] | null
      cons: string[] | null
      is_verified: boolean
      is_featured: boolean
      status: 'pending' | 'approved' | 'rejected' | 'hidden'
      helpful_count: number
      response: string | null
      responded_at: string | null
      responded_by: string | null
      booking_id: string | null
      created_at: string
      updated_at: string
    }
    Insert: {
      id?: string
      service_id: string
      user_id?: string | null
      rating: number
      title?: string | null
      content: string
      pros?: string[] | null
      cons?: string[] | null
      is_verified?: boolean
      is_featured?: boolean
      status?: 'pending' | 'approved' | 'rejected' | 'hidden'
      helpful_count?: number
      response?: string | null
      responded_at?: string | null
      responded_by?: string | null
      booking_id?: string | null
      created_at?: string
      updated_at?: string
    }
    Update: {
      id?: string
      service_id?: string
      user_id?: string | null
      rating?: number
      title?: string | null
      content?: string
      pros?: string[] | null
      cons?: string[] | null
      is_verified?: boolean
      is_featured?: boolean
      status?: 'pending' | 'approved' | 'rejected' | 'hidden'
      helpful_count?: number
      response?: string | null
      responded_at?: string | null
      responded_by?: string | null
      booking_id?: string | null
      updated_at?: string
    }
    Relationships: []
  }
}