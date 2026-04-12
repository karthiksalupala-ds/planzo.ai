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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          travel_style: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          travel_style?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          travel_style?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      saved_trips: {
        Row: {
          budget: number | null
          created_at: string
          days: number | null
          id: string
          mood: string | null
          plan_data: Json
          query: string | null
          start_date: string | null
          status: string | null
          title: string
          travelers: number | null
          user_id: string
        }
        Insert: {
          budget?: number | null
          created_at?: string
          days?: number | null
          id?: string
          mood?: string | null
          plan_data?: Json
          query?: string | null
          start_date?: string | null
          status?: string | null
          title: string
          travelers?: number | null
          user_id: string
        }
        Update: {
          budget?: number | null
          created_at?: string
          days?: number | null
          id?: string
          mood?: string | null
          plan_data?: Json
          query?: string | null
          start_date?: string | null
          status?: string | null
          title?: string
          travelers?: number | null
          user_id?: string
        }
        Relationships: []
      }
      trip_cache: {
        Row: {
          id: string
          query_hash: string
          response_json: Json
          created_at: string
        }
        Insert: {
          id?: string
          query_hash: string
          response_json: Json
          created_at?: string
        }
        Update: {
          id?: string
          query_hash?: string
          response_json?: Json
          created_at?: string
        }
        Relationships: []
      }
      request_logs: {
        Row: {
          id: string
          user_id: string | null
          request_timestamp: string
          execution_time_ms: number | null
          cache_hit: boolean | null
          status_code: number | null
          error_details: string | null
          metadata: Json | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          request_timestamp?: string
          execution_time_ms?: number | null
          cache_hit?: boolean | null
          status_code?: number | null
          error_details?: string | null
          metadata?: Json | null
        }
        Update: {
          id?: string
          user_id?: string | null
          request_timestamp?: string
          execution_time_ms?: number | null
          cache_hit?: boolean | null
          status_code?: number | null
          error_details?: string | null
          metadata?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "request_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      trip_expenses: {
        Row: {
          amount: number
          category: string
          created_at: string
          description: string | null
          expense_date: string
          id: string
          payer_name: string | null
          trip_id: string
          user_id: string
        }
        Insert: {
          amount: number
          category: string
          created_at?: string
          description?: string | null
          expense_date?: string
          id?: string
          payer_name?: string | null
          trip_id: string
          user_id: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          description?: string | null
          expense_date?: string
          id?: string
          payer_name?: string | null
          trip_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_expenses_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "saved_trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_collaborators: {
        Row: {
          created_at: string
          display_name: string
          email: string | null
          id: string
          invited_by: string | null
          role: string
          status: string
          trip_id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          display_name: string
          email?: string | null
          id?: string
          invited_by?: string | null
          role?: string
          status?: string
          trip_id: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          display_name?: string
          email?: string | null
          id?: string
          invited_by?: string | null
          role?: string
          status?: string
          trip_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trip_collaborators_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "saved_trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_messages: {
        Row: {
          created_at: string
          display_name: string
          id: string
          message: string
          trip_id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          display_name: string
          id?: string
          message: string
          trip_id: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          display_name?: string
          id?: string
          message?: string
          trip_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trip_messages_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "saved_trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_votes: {
        Row: {
          created_at: string
          id: string
          subject_key: string
          subject_label: string
          subject_type: string
          trip_id: string
          user_id: string | null
          vote_value: number
          voter_key: string
          voter_name: string
        }
        Insert: {
          created_at?: string
          id?: string
          subject_key: string
          subject_label: string
          subject_type: string
          trip_id: string
          user_id?: string | null
          vote_value: number
          voter_key: string
          voter_name: string
        }
        Update: {
          created_at?: string
          id?: string
          subject_key?: string
          subject_label?: string
          subject_type?: string
          trip_id?: string
          user_id?: string | null
          vote_value?: number
          voter_key?: string
          voter_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_votes_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "saved_trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_expense_splits: {
        Row: {
          amount_owed: number
          created_at: string
          expense_id: string
          id: string
          member_email: string | null
          member_name: string
          settled: boolean
          trip_id: string
        }
        Insert: {
          amount_owed: number
          created_at?: string
          expense_id: string
          id?: string
          member_email?: string | null
          member_name: string
          settled?: boolean
          trip_id: string
        }
        Update: {
          amount_owed?: number
          created_at?: string
          expense_id?: string
          id?: string
          member_email?: string | null
          member_name?: string
          settled?: boolean
          trip_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_expense_splits_expense_id_fkey"
            columns: ["expense_id"]
            isOneToOne: false
            referencedRelation: "trip_expenses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_expense_splits_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "saved_trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_price_watches: {
        Row: {
          baseline_price: number
          category: string
          created_at: string
          currency: string
          current_price: number
          id: string
          label: string
          notes: string | null
          status: string
          target_price: number
          trip_id: string
          updated_at: string
        }
        Insert: {
          baseline_price: number
          category?: string
          created_at?: string
          currency?: string
          current_price: number
          id?: string
          label: string
          notes?: string | null
          status?: string
          target_price: number
          trip_id: string
          updated_at?: string
        }
        Update: {
          baseline_price?: number
          category?: string
          created_at?: string
          currency?: string
          current_price?: number
          id?: string
          label?: string
          notes?: string | null
          status?: string
          target_price?: number
          trip_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_price_watches_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "saved_trips"
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
      [_ in never]: never
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
    Enums: {},
  },
} as const
