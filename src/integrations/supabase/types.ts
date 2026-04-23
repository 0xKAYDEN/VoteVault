export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      api_keys: {
        Row: {
          created_at: string
          id: number
          key_hash: string
          key_prefix: string
          label: string | null
          last_used_at: string | null
          owner_id: string
          public_id: string
          revoked: boolean
          server_id: number | null
        }
        Insert: {
          created_at?: string
          id?: number
          key_hash: string
          key_prefix: string
          label?: string | null
          last_used_at?: string | null
          owner_id: string
          public_id?: string
          revoked?: boolean
          server_id?: number | null
        }
        Update: {
          created_at?: string
          id?: number
          key_hash?: string
          key_prefix?: string
          label?: string | null
          last_used_at?: string | null
          owner_id?: string
          public_id?: string
          revoked?: boolean
          server_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "api_keys_server_id_fkey"
            columns: ["server_id"]
            isOneToOne: false
            referencedRelation: "servers"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          public_id: string
          updated_at: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          public_id?: string
          updated_at?: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          public_id?: string
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      reviews: {
        Row: {
          comment: string | null
          created_at: string
          id: number
          owner_response: string | null
          public_id: string
          rating: number
          server_id: number
          user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: number
          owner_response?: string | null
          public_id?: string
          rating: number
          server_id: number
          user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: number
          owner_response?: string | null
          public_id?: string
          rating?: number
          server_id?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_server_id_fkey"
            columns: ["server_id"]
            isOneToOne: false
            referencedRelation: "servers"
            referencedColumns: ["id"]
          },
        ]
      }
      servers: {
        Row: {
          banner_url: string | null
          created_at: string
          discord_url: string | null
          events_time: string | null
          exp_rate: number | null
          features: string | null
          id: number
          is_featured: boolean
          is_online: boolean
          logo_url: string | null
          long_description: string | null
          name: string
          owner_id: string
          player_count: number
          profile_visits: number
          public_id: string
          rate: string | null
          rating_avg: number
          rating_count: number
          region: string | null
          short_description: string
          slug: string
          status: Database["public"]["Enums"]["server_status"]
          upcoming_updates: string | null
          updated_at: string
          version: string | null
          vote_count: number
          website_url: string | null
        }
        Insert: {
          banner_url?: string | null
          created_at?: string
          discord_url?: string | null
          events_time?: string | null
          exp_rate?: number | null
          features?: string | null
          id?: number
          is_featured?: boolean
          is_online?: boolean
          logo_url?: string | null
          long_description?: string | null
          name: string
          owner_id: string
          player_count?: number
          profile_visits?: number
          public_id?: string
          rate?: string | null
          rating_avg?: number
          rating_count?: number
          region?: string | null
          short_description: string
          slug: string
          status?: Database["public"]["Enums"]["server_status"]
          upcoming_updates?: string | null
          updated_at?: string
          version?: string | null
          vote_count?: number
          website_url?: string | null
        }
        Update: {
          banner_url?: string | null
          created_at?: string
          discord_url?: string | null
          events_time?: string | null
          exp_rate?: number | null
          features?: string | null
          id?: number
          is_featured?: boolean
          is_online?: boolean
          logo_url?: string | null
          long_description?: string | null
          name?: string
          owner_id?: string
          player_count?: number
          profile_visits?: number
          public_id?: string
          rate?: string | null
          rating_avg?: number
          rating_count?: number
          region?: string | null
          short_description?: string
          slug?: string
          status?: Database["public"]["Enums"]["server_status"]
          upcoming_updates?: string | null
          updated_at?: string
          version?: string | null
          vote_count?: number
          website_url?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      votes: {
        Row: {
          challenge_type_passed: string | null
          id: number
          is_suspicious: boolean
          public_id: string
          server_id: number
          voted_at: string
          voter_city: string | null
          voter_country: string | null
          voter_fingerprint: string | null
          voter_ip_hash: string | null
          voter_user_agent: string | null
          voter_user_id: string | null
        }
        Insert: {
          challenge_type_passed?: string | null
          id?: number
          is_suspicious?: boolean
          public_id?: string
          server_id: number
          voted_at?: string
          voter_city?: string | null
          voter_country?: string | null
          voter_fingerprint?: string | null
          voter_ip_hash?: string | null
          voter_user_agent?: string | null
          voter_user_id?: string | null
        }
        Update: {
          challenge_type_passed?: string | null
          id?: number
          is_suspicious?: boolean
          public_id?: string
          server_id?: number
          voted_at?: string
          voter_city?: string | null
          voter_country?: string | null
          voter_fingerprint?: string | null
          voter_ip_hash?: string | null
          voter_user_agent?: string | null
          voter_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "votes_server_id_fkey"
            columns: ["server_id"]
            isOneToOne: false
            referencedRelation: "servers"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "player" | "server_owner" | "admin"
      server_status: "pending" | "approved" | "rejected" | "banned"
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
  public: {
    Enums: {
      app_role: ["player", "server_owner", "admin"],
      server_status: ["pending", "approved", "rejected", "banned"],
    },
  },
} as const
