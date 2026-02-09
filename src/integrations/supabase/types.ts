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
      ai_insights: {
        Row: {
          actionable: string | null
          category: string
          created_at: string | null
          data: Json | null
          icon: string | null
          id: string
          impact: string
          insight: string
          is_dismissed: boolean | null
          is_new: boolean | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          actionable?: string | null
          category: string
          created_at?: string | null
          data?: Json | null
          icon?: string | null
          id?: string
          impact: string
          insight: string
          is_dismissed?: boolean | null
          is_new?: boolean | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          actionable?: string | null
          category?: string
          created_at?: string | null
          data?: Json | null
          icon?: string | null
          id?: string
          impact?: string
          insight?: string
          is_dismissed?: boolean | null
          is_new?: boolean | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      cycle_logs: {
        Row: {
          avg_cycle_length: number | null
          confidence: number | null
          created_at: string | null
          date: string
          energy: number | null
          has_period: boolean | null
          id: string
          last_period_start: string | null
          mood: number | null
          notes: string | null
          period_length: number | null
          safety_mode_enabled: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          avg_cycle_length?: number | null
          confidence?: number | null
          created_at?: string | null
          date: string
          energy?: number | null
          has_period?: boolean | null
          id?: string
          last_period_start?: string | null
          mood?: number | null
          notes?: string | null
          period_length?: number | null
          safety_mode_enabled?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          avg_cycle_length?: number | null
          confidence?: number | null
          created_at?: string | null
          date?: string
          energy?: number | null
          has_period?: boolean | null
          id?: string
          last_period_start?: string | null
          mood?: number | null
          notes?: string | null
          period_length?: number | null
          safety_mode_enabled?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      follows: {
        Row: {
          created_at: string | null
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string | null
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string | null
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          allow_follow: boolean | null
          anonymous_mode: boolean | null
          avatar_url: string | null
          avg_cycle_length: number | null
          bio: string | null
          created_at: string | null
          current_rank: string | null
          display_name: string | null
          email: string
          id: string
          last_login: string | null
          last_monthly_reset: string | null
          last_period_start: string | null
          last_xp_decay: string | null
          login_streak: number | null
          monthly_xp: number | null
          name: string | null
          period_days: Json | null
          period_length: number | null
          pms_days: number | null
          privacy_level: string | null
          share_stats: boolean | null
          share_strategies: boolean | null
          total_xp: number | null
          trading_streak: number | null
          updated_at: string | null
          username: string | null
          variation_days: number | null
        }
        Insert: {
          allow_follow?: boolean | null
          anonymous_mode?: boolean | null
          avatar_url?: string | null
          avg_cycle_length?: number | null
          bio?: string | null
          created_at?: string | null
          current_rank?: string | null
          display_name?: string | null
          email: string
          id: string
          last_login?: string | null
          last_monthly_reset?: string | null
          last_period_start?: string | null
          last_xp_decay?: string | null
          login_streak?: number | null
          monthly_xp?: number | null
          name?: string | null
          period_days?: Json | null
          period_length?: number | null
          pms_days?: number | null
          privacy_level?: string | null
          share_stats?: boolean | null
          share_strategies?: boolean | null
          total_xp?: number | null
          trading_streak?: number | null
          updated_at?: string | null
          username?: string | null
          variation_days?: number | null
        }
        Update: {
          allow_follow?: boolean | null
          anonymous_mode?: boolean | null
          avatar_url?: string | null
          avg_cycle_length?: number | null
          bio?: string | null
          created_at?: string | null
          current_rank?: string | null
          display_name?: string | null
          email?: string
          id?: string
          last_login?: string | null
          last_monthly_reset?: string | null
          last_period_start?: string | null
          last_xp_decay?: string | null
          login_streak?: number | null
          monthly_xp?: number | null
          name?: string | null
          period_days?: Json | null
          period_length?: number | null
          pms_days?: number | null
          privacy_level?: string | null
          share_stats?: boolean | null
          share_strategies?: boolean | null
          total_xp?: number | null
          trading_streak?: number | null
          updated_at?: string | null
          username?: string | null
          variation_days?: number | null
        }
        Relationships: []
      }
      prop_firm_accounts: {
        Row: {
          account_number: string
          auto_sync: boolean | null
          balance: number | null
          created_at: string | null
          equity: number | null
          firm_name: string
          id: string
          investor_password_encrypted: string | null
          last_sync: string | null
          profit: number | null
          server: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          account_number: string
          auto_sync?: boolean | null
          balance?: number | null
          created_at?: string | null
          equity?: number | null
          firm_name: string
          id?: string
          investor_password_encrypted?: string | null
          last_sync?: string | null
          profit?: number | null
          server?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          account_number?: string
          auto_sync?: boolean | null
          balance?: number | null
          created_at?: string | null
          equity?: number | null
          firm_name?: string
          id?: string
          investor_password_encrypted?: string | null
          last_sync?: string | null
          profit?: number | null
          server?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      public_stats: {
        Row: {
          avg_risk_percent: number | null
          avg_rrr: number | null
          best_rrr: number | null
          breakeven_trades: number | null
          consistency_score: number | null
          created_at: string | null
          id: string
          losing_trades: number | null
          period_end: string | null
          period_start: string
          period_type: string
          top_strategy: string | null
          top_strategy_win_rate: number | null
          total_trades: number | null
          updated_at: string | null
          user_id: string
          win_rate: number | null
          winning_trades: number | null
          worst_rrr: number | null
        }
        Insert: {
          avg_risk_percent?: number | null
          avg_rrr?: number | null
          best_rrr?: number | null
          breakeven_trades?: number | null
          consistency_score?: number | null
          created_at?: string | null
          id?: string
          losing_trades?: number | null
          period_end?: string | null
          period_start: string
          period_type: string
          top_strategy?: string | null
          top_strategy_win_rate?: number | null
          total_trades?: number | null
          updated_at?: string | null
          user_id: string
          win_rate?: number | null
          winning_trades?: number | null
          worst_rrr?: number | null
        }
        Update: {
          avg_risk_percent?: number | null
          avg_rrr?: number | null
          best_rrr?: number | null
          breakeven_trades?: number | null
          consistency_score?: number | null
          created_at?: string | null
          id?: string
          losing_trades?: number | null
          period_end?: string | null
          period_start?: string
          period_type?: string
          top_strategy?: string | null
          top_strategy_win_rate?: number | null
          total_trades?: number | null
          updated_at?: string | null
          user_id?: string
          win_rate?: number | null
          winning_trades?: number | null
          worst_rrr?: number | null
        }
        Relationships: []
      }
      strategies: {
        Row: {
          avg_rrr: number | null
          confirmations: string[] | null
          created_at: string | null
          description: string | null
          entry_triggers: string[] | null
          exit_rules: string[] | null
          general_rules: string[] | null
          id: string
          markets: string[] | null
          name: string
          risk_per_trade: number | null
          score: number | null
          stop_loss_type: string | null
          take_profit_type: string | null
          target_rrr: number | null
          timeframes: string[] | null
          total_trades: number | null
          updated_at: string | null
          user_id: string
          win_rate: number | null
        }
        Insert: {
          avg_rrr?: number | null
          confirmations?: string[] | null
          created_at?: string | null
          description?: string | null
          entry_triggers?: string[] | null
          exit_rules?: string[] | null
          general_rules?: string[] | null
          id?: string
          markets?: string[] | null
          name: string
          risk_per_trade?: number | null
          score?: number | null
          stop_loss_type?: string | null
          take_profit_type?: string | null
          target_rrr?: number | null
          timeframes?: string[] | null
          total_trades?: number | null
          updated_at?: string | null
          user_id: string
          win_rate?: number | null
        }
        Update: {
          avg_rrr?: number | null
          confirmations?: string[] | null
          created_at?: string | null
          description?: string | null
          entry_triggers?: string[] | null
          exit_rules?: string[] | null
          general_rules?: string[] | null
          id?: string
          markets?: string[] | null
          name?: string
          risk_per_trade?: number | null
          score?: number | null
          stop_loss_type?: string | null
          take_profit_type?: string | null
          target_rrr?: number | null
          timeframes?: string[] | null
          total_trades?: number | null
          updated_at?: string | null
          user_id?: string
          win_rate?: number | null
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          id: string
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          tier: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          status: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          tier: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          tier?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      trades: {
        Row: {
          closed_rrr: number | null
          confirmations: Json | null
          created_at: string | null
          custom_exit_reason: string | null
          cycle_day: number | null
          cycle_phase: string | null
          date: string
          direction: string
          emotion_after: number | null
          emotion_before: number | null
          entry_price: number | null
          exit_price: number | null
          exit_reason: string | null
          id: string
          ideal_sl_size: number | null
          image_after_large: string | null
          image_after_small: string | null
          image_before_large: string | null
          image_before_small: string | null
          instrument: string
          learnings: string | null
          loss_reason: string | null
          max_r_reached: number | null
          planned_rrr: number | null
          planned_sl_size: number | null
          pnl: number | null
          post_trade_note: string | null
          pre_trade_note: string | null
          rating: number | null
          result: string | null
          risk_percent: number | null
          sl_price: number | null
          status: string | null
          strategy: string | null
          time: string | null
          timeframe_large: string | null
          timeframe_small: string | null
          tp_price: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          closed_rrr?: number | null
          confirmations?: Json | null
          created_at?: string | null
          custom_exit_reason?: string | null
          cycle_day?: number | null
          cycle_phase?: string | null
          date: string
          direction: string
          emotion_after?: number | null
          emotion_before?: number | null
          entry_price?: number | null
          exit_price?: number | null
          exit_reason?: string | null
          id?: string
          ideal_sl_size?: number | null
          image_after_large?: string | null
          image_after_small?: string | null
          image_before_large?: string | null
          image_before_small?: string | null
          instrument: string
          learnings?: string | null
          loss_reason?: string | null
          max_r_reached?: number | null
          planned_rrr?: number | null
          planned_sl_size?: number | null
          pnl?: number | null
          post_trade_note?: string | null
          pre_trade_note?: string | null
          rating?: number | null
          result?: string | null
          risk_percent?: number | null
          sl_price?: number | null
          status?: string | null
          strategy?: string | null
          time?: string | null
          timeframe_large?: string | null
          timeframe_small?: string | null
          tp_price?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          closed_rrr?: number | null
          confirmations?: Json | null
          created_at?: string | null
          custom_exit_reason?: string | null
          cycle_day?: number | null
          cycle_phase?: string | null
          date?: string
          direction?: string
          emotion_after?: number | null
          emotion_before?: number | null
          entry_price?: number | null
          exit_price?: number | null
          exit_reason?: string | null
          id?: string
          ideal_sl_size?: number | null
          image_after_large?: string | null
          image_after_small?: string | null
          image_before_large?: string | null
          image_before_small?: string | null
          instrument?: string
          learnings?: string | null
          loss_reason?: string | null
          max_r_reached?: number | null
          planned_rrr?: number | null
          planned_sl_size?: number | null
          pnl?: number | null
          post_trade_note?: string | null
          pre_trade_note?: string | null
          rating?: number | null
          result?: string | null
          risk_percent?: number | null
          sl_price?: number | null
          status?: string | null
          strategy?: string | null
          time?: string | null
          timeframe_large?: string | null
          timeframe_small?: string | null
          tp_price?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          created_at: string | null
          custom_loss_reasons: string[] | null
          custom_win_reasons: string[] | null
          default_loss_reasons: string[] | null
          default_win_reasons: string[] | null
          id: string
          settings: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          custom_loss_reasons?: string[] | null
          custom_win_reasons?: string[] | null
          default_loss_reasons?: string[] | null
          default_win_reasons?: string[] | null
          id?: string
          settings?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          custom_loss_reasons?: string[] | null
          custom_win_reasons?: string[] | null
          default_loss_reasons?: string[] | null
          default_win_reasons?: string[] | null
          id?: string
          settings?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      weekly_challenges: {
        Row: {
          avg_rrr: number | null
          challenge_type: string
          consistency_score: number | null
          created_at: string | null
          id: string
          rank: number | null
          score: number
          total_r: number | null
          total_trades: number | null
          updated_at: string | null
          user_id: string
          week_end: string
          week_start: string
          win_rate: number | null
        }
        Insert: {
          avg_rrr?: number | null
          challenge_type: string
          consistency_score?: number | null
          created_at?: string | null
          id?: string
          rank?: number | null
          score: number
          total_r?: number | null
          total_trades?: number | null
          updated_at?: string | null
          user_id: string
          week_end: string
          week_start: string
          win_rate?: number | null
        }
        Update: {
          avg_rrr?: number | null
          challenge_type?: string
          consistency_score?: number | null
          created_at?: string | null
          id?: string
          rank?: number | null
          score?: number
          total_r?: number | null
          total_trades?: number | null
          updated_at?: string | null
          user_id?: string
          week_end?: string
          week_start?: string
          win_rate?: number | null
        }
        Relationships: []
      }
      metatrader_accounts: {
        Row: {
          id: string
          user_id: string
          account_number: string
          server: string
          platform: string
          account_type: string
          prop_firm: string | null
          include_in_analytics: boolean
          connected_at: string | null
          last_sync: string | null
          is_active: boolean
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          account_number: string
          server: string
          platform: string
          account_type?: string
          prop_firm?: string | null
          include_in_analytics?: boolean
          connected_at?: string | null
          last_sync?: string | null
          is_active?: boolean
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          account_number?: string
          server?: string
          platform?: string
          account_type?: string
          prop_firm?: string | null
          include_in_analytics?: boolean
          connected_at?: string | null
          last_sync?: string | null
          is_active?: boolean
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "metatrader_accounts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      mt_trades: {
        Row: {
          id: string
          user_id: string
          account_id: string
          ticket: number
          symbol: string
          cmd: string
          open_price: number | null
          close_price: number | null
          volume: number | null
          open_time: string | null
          close_time: string | null
          profit: number | null
          comment: string | null
          screenshot_url: string | null
          entry_reason: string | null
          rrr: number | null
          position_size: number | null
          is_enriched: boolean
          synced_at: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          account_id: string
          ticket: number
          symbol: string
          cmd: string
          open_price?: number | null
          close_price?: number | null
          volume?: number | null
          open_time?: string | null
          close_time?: string | null
          profit?: number | null
          comment?: string | null
          screenshot_url?: string | null
          entry_reason?: string | null
          rrr?: number | null
          position_size?: number | null
          is_enriched?: boolean
          synced_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          account_id?: string
          ticket?: number
          symbol?: string
          cmd?: string
          open_price?: number | null
          close_price?: number | null
          volume?: number | null
          open_time?: string | null
          close_time?: string | null
          profit?: number | null
          comment?: string | null
          screenshot_url?: string | null
          entry_reason?: string | null
          rrr?: number | null
          position_size?: number | null
          is_enriched?: boolean
          synced_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mt_trades_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mt_trades_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "metatrader_accounts"
            referencedColumns: ["id"]
          }
        ]
      }
      xp_logs: {
        Row: {
          amount: number
          created_at: string | null
          details: Json | null
          id: string
          reason: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          details?: Json | null
          id?: string
          reason: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          details?: Json | null
          id?: string
          reason?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_rank: { Args: { xp: number }; Returns: string }
      get_rank_monthly_requirement: { Args: { rank: string }; Returns: number }
      process_monthly_maintenance: { Args: never; Returns: undefined }
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
