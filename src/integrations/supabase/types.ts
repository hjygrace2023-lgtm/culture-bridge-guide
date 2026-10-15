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
    PostgrestVersion: "14.17"
  }
  public: {
    Tables: {
      concept_mastery: {
        Row: {
          category: string
          concept: string
          hits: number
          last_correct: boolean | null
          mastered_after_miss: boolean
          misses: number
          region: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category: string
          concept: string
          hits?: number
          last_correct?: boolean | null
          mastered_after_miss?: boolean
          misses?: number
          region: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          concept?: string
          hits?: number
          last_correct?: boolean | null
          mastered_after_miss?: boolean
          misses?: number
          region?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      history_entries: {
        Row: {
          created_at: string
          id: string
          kind: string
          payload: Json
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          kind?: string
          payload?: Json
          title?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          kind?: string
          payload?: Json
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      quiz_attempts: {
        Row: {
          chosen_id: string
          correct: boolean
          created_at: string
          id: string
          is_first: boolean
          question_id: string
          session_id: string
          user_id: string
          xp: number
        }
        Insert: {
          chosen_id: string
          correct: boolean
          created_at?: string
          id?: string
          is_first: boolean
          question_id: string
          session_id: string
          user_id: string
          xp?: number
        }
        Update: {
          chosen_id?: string
          correct?: boolean
          created_at?: string
          id?: string
          is_first?: boolean
          question_id?: string
          session_id?: string
          user_id?: string
          xp?: number
        }
        Relationships: [
          {
            foreignKeyName: "quiz_attempts_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "quiz_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_attempts_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "quiz_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_questions: {
        Row: {
          category: string
          concept: string
          correct_id: string
          created_at: string
          difficulty: number
          explanation: string
          feedback: Json
          id: string
          options: Json
          owner_id: string | null
          question: string
          region: string
          scenario: string
          source: string
        }
        Insert: {
          category: string
          concept: string
          correct_id: string
          created_at?: string
          difficulty?: number
          explanation?: string
          feedback?: Json
          id?: string
          options: Json
          owner_id?: string | null
          question: string
          region: string
          scenario: string
          source?: string
        }
        Update: {
          category?: string
          concept?: string
          correct_id?: string
          created_at?: string
          difficulty?: number
          explanation?: string
          feedback?: Json
          id?: string
          options?: Json
          owner_id?: string | null
          question?: string
          region?: string
          scenario?: string
          source?: string
        }
        Relationships: []
      }
      quiz_sessions: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          question_ids: string[]
          regions: string[]
          streak: number
          user_id: string
          xp: number
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          question_ids?: string[]
          regions?: string[]
          streak?: number
          user_id: string
          xp?: number
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          question_ids?: string[]
          regions?: string[]
          streak?: number
          user_id?: string
          xp?: number
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          leaderboard_opt_out: boolean
          public_name: string | null
          regions: string[]
          updated_at: string
          user_id: string
        }
        Insert: {
          leaderboard_opt_out?: boolean
          public_name?: string | null
          regions?: string[]
          updated_at?: string
          user_id: string
        }
        Update: {
          leaderboard_opt_out?: boolean
          public_name?: string | null
          regions?: string[]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      xp_events: {
        Row: {
          amount: number
          created_at: string
          id: string
          reason: string
          region: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          reason: string
          region?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          reason?: string
          region?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      complete_quiz: { Args: { _session: string }; Returns: Json }
      get_leaderboard: {
        Args: { _period: string; _region: string }
        Returns: Json
      }
      start_quiz: {
        Args: { _regions: string[]; _size?: number }
        Returns: string
      }
      submit_answer: {
        Args: { _choice: string; _question: string; _session: string }
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
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
