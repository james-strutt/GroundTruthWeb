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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      appraisals: {
        Row: {
          address: string
          area_sqm: number | null
          created_at: string
          id: string
          is_favourite: boolean
          latitude: number | null
          longitude: number | null
          notes: string | null
          price_estimate: Json | null
          project_id: string | null
          property_id: string | null
          propid: number | null
          scored_comps: Json
          spatial_data: Json
          suburb: string
          updated_at: string | null
          user_id: string
          zone_code: string | null
        }
        Insert: {
          address?: string
          area_sqm?: number | null
          created_at?: string
          id?: string
          is_favourite?: boolean
          latitude?: number | null
          longitude?: number | null
          notes?: string | null
          price_estimate?: Json | null
          project_id?: string | null
          property_id?: string | null
          propid?: number | null
          scored_comps?: Json
          spatial_data?: Json
          suburb?: string
          updated_at?: string | null
          user_id: string
          zone_code?: string | null
        }
        Update: {
          address?: string
          area_sqm?: number | null
          created_at?: string
          id?: string
          is_favourite?: boolean
          latitude?: number | null
          longitude?: number | null
          notes?: string | null
          price_estimate?: Json | null
          project_id?: string | null
          property_id?: string | null
          propid?: number | null
          scored_comps?: Json
          spatial_data?: Json
          suburb?: string
          updated_at?: string | null
          user_id?: string
          zone_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appraisals_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appraisals_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appraisals_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appraisals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      directories: {
        Row: {
          colour: string | null
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          is_archived: boolean | null
          name: string
          team_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          colour?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_archived?: boolean | null
          name: string
          team_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          colour?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_archived?: boolean | null
          name?: string
          team_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "directories_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      inspections: {
        Row: {
          address: string
          created_at: string
          id: string
          is_favourite: boolean
          latitude: number | null
          longitude: number | null
          notes: string | null
          overall_score: number | null
          photo_count: number | null
          photos: Json
          project_id: string | null
          property_id: string | null
          propid: number | null
          report: Json | null
          suburb: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          address?: string
          created_at?: string
          id?: string
          is_favourite?: boolean
          latitude?: number | null
          longitude?: number | null
          notes?: string | null
          overall_score?: number | null
          photo_count?: number | null
          photos?: Json
          project_id?: string | null
          property_id?: string | null
          propid?: number | null
          report?: Json | null
          suburb?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          address?: string
          created_at?: string
          id?: string
          is_favourite?: boolean
          latitude?: number | null
          longitude?: number | null
          notes?: string | null
          overall_score?: number | null
          photo_count?: number | null
          photos?: Json
          project_id?: string | null
          property_id?: string | null
          propid?: number | null
          report?: Json | null
          suburb?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inspections_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inspections_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inspections_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inspections_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      properties: {
        Row: {
          address: string
          created_at: string | null
          directory_id: string
          id: string
          latitude: number | null
          longitude: number | null
          normalised_address: string
          notes: string | null
          propid: number | null
          status: string | null
          suburb: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          address: string
          created_at?: string | null
          directory_id: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          normalised_address: string
          notes?: string | null
          propid?: number | null
          status?: string | null
          suburb?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          address?: string
          created_at?: string | null
          directory_id?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          normalised_address?: string
          notes?: string | null
          propid?: number | null
          status?: string | null
          suburb?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "properties_directory_id_fkey"
            columns: ["directory_id"]
            isOneToOne: false
            referencedRelation: "directories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "properties_directory_id_fkey"
            columns: ["directory_id"]
            isOneToOne: false
            referencedRelation: "directory_summary"
            referencedColumns: ["id"]
          },
        ]
      }
      snaps: {
        Row: {
          address: string
          ai_analysis: Json | null
          comparable_summary: Json | null
          confidence: number | null
          created_at: string
          id: string
          is_favourite: boolean
          latitude: number
          longitude: number
          photo_url: string | null
          postcode: string | null
          project_id: string | null
          property_id: string | null
          propid: number | null
          smart_suggestions: Json | null
          spatial_data: Json
          suburb: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          address?: string
          ai_analysis?: Json | null
          comparable_summary?: Json | null
          confidence?: number | null
          created_at?: string
          id?: string
          is_favourite?: boolean
          latitude: number
          longitude: number
          photo_url?: string | null
          postcode?: string | null
          project_id?: string | null
          property_id?: string | null
          propid?: number | null
          smart_suggestions?: Json | null
          spatial_data?: Json
          suburb?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          address?: string
          ai_analysis?: Json | null
          comparable_summary?: Json | null
          confidence?: number | null
          created_at?: string
          id?: string
          is_favourite?: boolean
          latitude?: number
          longitude?: number
          photo_url?: string | null
          postcode?: string | null
          project_id?: string | null
          property_id?: string | null
          propid?: number | null
          smart_suggestions?: Json | null
          spatial_data?: Json
          suburb?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "snaps_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "snaps_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "snaps_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "snaps_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          accepted_at: string | null
          id: string
          invited_at: string
          role: string
          team_id: string
          user_id: string
        }
        Insert: {
          accepted_at?: string | null
          id?: string
          invited_at?: string
          role?: string
          team_id: string
          user_id: string
        }
        Update: {
          accepted_at?: string | null
          id?: string
          invited_at?: string
          role?: string
          team_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          created_at: string
          id: string
          name: string
          owner_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          owner_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          owner_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          preferences: Json
          push_token: string | null
          subscription_tier: string
          team_id: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id: string
          preferences?: Json
          push_token?: string | null
          subscription_tier?: string
          team_id?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          preferences?: Json
          push_token?: string | null
          subscription_tier?: string
          team_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      waitlist: {
        Row: {
          created_at: string
          email: string
          id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
        }
        Relationships: []
      }
      walk_sessions: {
        Row: {
          analysis_narrative: string | null
          directory_id: string | null
          duration_seconds: number
          ended_at: string | null
          id: string
          is_favourite: boolean
          photos: Json
          property_id: string | null
          route: Json
          segments: Json
          started_at: string
          street_score: Json | null
          suburb: string
          title: string
          total_distance_metres: number
          user_id: string
        }
        Insert: {
          analysis_narrative?: string | null
          directory_id?: string | null
          duration_seconds?: number
          ended_at?: string | null
          id?: string
          is_favourite?: boolean
          photos?: Json
          property_id?: string | null
          route?: Json
          segments?: Json
          started_at?: string
          street_score?: Json | null
          suburb?: string
          title?: string
          total_distance_metres?: number
          user_id: string
        }
        Update: {
          analysis_narrative?: string | null
          directory_id?: string | null
          duration_seconds?: number
          ended_at?: string | null
          id?: string
          is_favourite?: boolean
          photos?: Json
          property_id?: string | null
          route?: Json
          segments?: Json
          started_at?: string
          street_score?: Json | null
          suburb?: string
          title?: string
          total_distance_metres?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "walk_sessions_directory_id_fkey"
            columns: ["directory_id"]
            isOneToOne: false
            referencedRelation: "directories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "walk_sessions_directory_id_fkey"
            columns: ["directory_id"]
            isOneToOne: false
            referencedRelation: "directory_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "walk_sessions_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "walk_sessions_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "walk_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      watched_properties: {
        Row: {
          address: string
          alerts: Json
          baseline_photo_url: string | null
          changes: Json
          created_at: string
          id: string
          is_favourite: boolean
          last_visited_at: string
          latest_photo_url: string | null
          latitude: number | null
          longitude: number | null
          property_id: string | null
          propid: number | null
          suburb: string
          user_id: string
          visit_count: number
        }
        Insert: {
          address?: string
          alerts?: Json
          baseline_photo_url?: string | null
          changes?: Json
          created_at?: string
          id?: string
          is_favourite?: boolean
          last_visited_at?: string
          latest_photo_url?: string | null
          latitude?: number | null
          longitude?: number | null
          property_id?: string | null
          propid?: number | null
          suburb?: string
          user_id: string
          visit_count?: number
        }
        Update: {
          address?: string
          alerts?: Json
          baseline_photo_url?: string | null
          changes?: Json
          created_at?: string
          id?: string
          is_favourite?: boolean
          last_visited_at?: string
          latest_photo_url?: string | null
          latitude?: number | null
          longitude?: number | null
          property_id?: string | null
          propid?: number | null
          suburb?: string
          user_id?: string
          visit_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "watched_properties_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "watched_properties_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "watched_properties_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      directory_summary: {
        Row: {
          colour: string | null
          created_at: string | null
          description: string | null
          icon: string | null
          id: string | null
          is_archived: boolean | null
          last_activity_at: string | null
          name: string | null
          property_count: number | null
          total_activity_count: number | null
          total_appraisal_count: number | null
          total_inspection_count: number | null
          total_monitor_count: number | null
          total_snap_count: number | null
          updated_at: string | null
          user_id: string | null
        }
        Relationships: []
      }
      properties_grouped: {
        Row: {
          address: string | null
          appraisal_count: number | null
          inspection_count: number | null
          last_activity_at: string | null
          latitude: number | null
          longitude: number | null
          monitor_count: number | null
          normalised_address: string | null
          propid: number | null
          snap_count: number | null
          suburb: string | null
          thumbnail_url: string | null
          total_records: number | null
          user_id: string | null
        }
        Relationships: []
      }
      properties_summary: {
        Row: {
          address: string | null
          appraisal_count: number | null
          created_at: string | null
          directory_colour: string | null
          directory_id: string | null
          directory_name: string | null
          id: string | null
          inspection_count: number | null
          last_activity_at: string | null
          latitude: number | null
          longitude: number | null
          monitor_count: number | null
          normalised_address: string | null
          notes: string | null
          propid: number | null
          snap_count: number | null
          status: string | null
          suburb: string | null
          thumbnail_url: string | null
          total_records: number | null
          updated_at: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "properties_directory_id_fkey"
            columns: ["directory_id"]
            isOneToOne: false
            referencedRelation: "directories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "properties_directory_id_fkey"
            columns: ["directory_id"]
            isOneToOne: false
            referencedRelation: "directory_summary"
            referencedColumns: ["id"]
          },
        ]
      }
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
