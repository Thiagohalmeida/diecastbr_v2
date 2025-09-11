export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      miniatures_master: {
        Row: {
          base_color: string | null
          brand: string
          collection_number: string | null
          created_at: string
          id: string
          launch_year: number | null
          model_name: string
          official_blister_photo_url: string | null
          series: string | null
          updated_at: string
        }
        Insert: {
          base_color?: string | null
          brand: string
          collection_number?: string | null
          created_at?: string
          id?: string
          launch_year?: number | null
          model_name: string
          official_blister_photo_url?: string | null
          series?: string | null
          updated_at?: string
        }
        Update: {
          base_color?: string | null
          brand?: string
          collection_number?: string | null
          created_at?: string
          id?: string
          launch_year?: number | null
          model_name?: string
          official_blister_photo_url?: string | null
          series?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          city: string | null
          created_at: string
          display_name: string | null
          email: string | null
          facebook: string | null
          id: string
          instagram: string | null
          postal_code: string | null
          tiktok: string | null
          total_miniatures: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          city?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          facebook?: string | null
          id?: string
          instagram?: string | null
          postal_code?: string | null
          tiktok?: string | null
          total_miniatures?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          city?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          facebook?: string | null
          id?: string
          instagram?: string | null
          postal_code?: string | null
          tiktok?: string | null
          total_miniatures?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_miniatures: {
        Row: {
          acquisition_date: string | null
          condition: string | null
          created_at: string
          id: string
          is_super_treasure_hunt: boolean | null
          is_treasure_hunt: boolean | null
          miniature_id: string | null
          personal_notes: string | null
          price_paid: number | null
          updated_at: string
          user_id: string
          user_photos_urls: string[] | null
          variants: string | null
        }
        Insert: {
          acquisition_date?: string | null
          condition?: string | null
          created_at?: string
          id?: string
          is_super_treasure_hunt?: boolean | null
          is_treasure_hunt?: boolean | null
          miniature_id?: string | null
          personal_notes?: string | null
          price_paid?: number | null
          updated_at?: string
          user_id: string
          user_photos_urls?: string[] | null
          variants?: string | null
        }
        Update: {
          acquisition_date?: string | null
          condition?: string | null
          created_at?: string
          id?: string
          is_super_treasure_hunt?: boolean | null
          is_treasure_hunt?: boolean | null
          miniature_id?: string | null
          personal_notes?: string | null
          price_paid?: number | null
          updated_at?: string
          user_id?: string
          user_photos_urls?: string[] | null
          variants?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_miniatures_miniature_id_fkey"
            columns: ["miniature_id"]
            isOneToOne: false
            referencedRelation: "miniatures_master"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Tables<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Row"]
export type TablesInsert<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Insert"]
export type TablesUpdate<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Update"]
export type Enums<T extends keyof Database["public"]["Enums"]> = Database["public"]["Enums"][T]
