
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      customers: {
        Row: {
          id: string
          full_name: string
          phone_number: string | null
          email: string | null
        }
        Insert: {
          id?: string
          full_name: string
          phone_number?: string | null
          email?: string | null
        }
        Update: {
          id?: string
          full_name?: string
          phone_number?: string | null
          email?: string | null
        }
      }
      products: {
        Row: {
          id: string
          name: string
          description: string | null
          sku: string | null
          cost_price: number | null
          sale_price: number
          image_url: string | null
          category: string | null
          tags: string[] | null
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          sku?: string | null
          cost_price?: number | null
          sale_price: number
          image_url?: string | null
          category?: string | null
          tags?: string[] | null
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          sku?: string | null
          cost_price?: number | null
          sale_price?: number
          image_url?: string | null
          category?: string | null
          tags?: string[] | null
        }
      }
      profiles: {
        Row: {
          id: string
          full_name: string | null
          role: "admin" | "employee"
        }
        Insert: {
          id: string
          full_name?: string | null
          role: "admin" | "employee"
        }
        Update: {
          id?: string
          full_name?: string | null
          role?: "admin" | "employee"
        }
      }
      quote_items: {
        Row: {
          id: string
          quote_id: string
          product_id: string
          quantity: number
          unit_sale_price: number
        }
        Insert: {
          id?: string
          quote_id: string
          product_id: string
          quantity: number
          unit_sale_price: number
        }
        Update: {
          id?: string
          quote_id?: string
          product_id?: string
          quantity?: number
          unit_sale_price?: number
        }
      }
      quotes: {
        Row: {
          id: string
          project_name: string
          customer_id: string
          created_by_profile_id: string
          total_cost_price: number | null
          total_sale_price: number
          discount_tier_applied: string | null
          generated_pdf_url: string | null
        }
        Insert: {
          id?: string
          project_name: string
          customer_id: string
          created_by_profile_id: string
          total_cost_price?: number | null
          total_sale_price: number
          discount_tier_applied?: string | null
          generated_pdf_url?: string | null
        }
        Update: {
          id?: string
          project_name?: string
          customer_id?: string
          created_by_profile_id?: string
          total_cost_price?: number | null
          total_sale_price?: number
          discount_tier_applied?: string | null
          generated_pdf_url?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_products_with_permission: {
        Args: {}
        Returns: {
            id: string
            name: string
            description: string | null
            sku: string | null
            cost_price: number | null
            sale_price: number
            image_url: string | null
            category: string | null
            tags: string[] | null
        }[]
      }
    }
    Enums: {
      user_role: "admin" | "employee"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}


// Custom application types
export type Product = Database['public']['Tables']['products']['Row'];
export type Customer = Database['public']['Tables']['customers']['Row'];
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Quote = Database['public']['Tables']['quotes']['Row'];

export type QuoteItem = {
    product: Product;
    quantity: number;
    unit_sale_price: number;
    total_price: number;
};
