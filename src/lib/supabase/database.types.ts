export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          display_name: string | null
          target_level: 'A1' | 'A2' | 'B1' | 'B2'
          daily_new_cards: number
          timezone: string
          progress: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          display_name?: string | null
          target_level?: 'A1' | 'A2' | 'B1' | 'B2'
          daily_new_cards?: number
          timezone?: string
          progress?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          display_name?: string | null
          target_level?: 'A1' | 'A2' | 'B1' | 'B2'
          daily_new_cards?: number
          timezone?: string
          progress?: Json
          updated_at?: string
        }
        Relationships: []
      }
      topics: {
        Row: {
          id: number
          slug: string
          name_fi: string
          name_en: string
          yki_category: string
          sort_order: number
        }
        Insert: {
          id?: number
          slug: string
          name_fi: string
          name_en: string
          yki_category: string
          sort_order: number
        }
        Update: {
          slug?: string
          name_fi?: string
          name_en?: string
          yki_category?: string
          sort_order?: number
        }
        Relationships: []
      }
      words: {
        Row: {
          id: number
          base_form: string
          translation_en: string
          frequency_rank: number | null
          level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'
          part_of_speech: string | null
          topic_id: number | null
          ipa: string | null
          created_at: string
        }
        Insert: {
          id?: number
          base_form: string
          translation_en: string
          frequency_rank?: number | null
          level?: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'
          part_of_speech?: string | null
          topic_id?: number | null
          ipa?: string | null
          created_at?: string
        }
        Update: {
          base_form?: string
          translation_en?: string
          frequency_rank?: number | null
          level?: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'
          part_of_speech?: string | null
          topic_id?: number | null
          ipa?: string | null
        }
        Relationships: []
      }
      sentences: {
        Row: {
          id: number
          kirjakieli: string
          puhekieli: string | null
          translation_en: string
          level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'
          topic_id: number | null
          audio_id: number | null
          created_at: string
        }
        Insert: {
          id?: number
          kirjakieli: string
          puhekieli?: string | null
          translation_en: string
          level?: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'
          topic_id?: number | null
          audio_id?: number | null
          created_at?: string
        }
        Update: {
          kirjakieli?: string
          puhekieli?: string | null
          translation_en?: string
          level?: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'
          topic_id?: number | null
          audio_id?: number | null
        }
        Relationships: []
      }
      audio: {
        Row: {
          id: number
          storage_path: string
          duration_ms: number | null
          speaker_gender: 'M' | 'F' | null
          dialect: 'standard' | 'colloquial' | null
          created_at: string
        }
        Insert: {
          id?: number
          storage_path: string
          duration_ms?: number | null
          speaker_gender?: 'M' | 'F' | null
          dialect?: 'standard' | 'colloquial' | null
          created_at?: string
        }
        Update: {
          storage_path?: string
          duration_ms?: number | null
          speaker_gender?: 'M' | 'F' | null
          dialect?: 'standard' | 'colloquial' | null
        }
        Relationships: []
      }
      mnemonics: {
        Row: {
          id: number
          word_id: number
          user_id: string | null
          text: string
          image_url: string | null
          is_public: boolean
          upvotes: number
          created_at: string
        }
        Insert: {
          id?: number
          word_id: number
          user_id?: string | null
          text: string
          image_url?: string | null
          is_public?: boolean
          upvotes?: number
          created_at?: string
        }
        Update: {
          text?: string
          image_url?: string | null
          is_public?: boolean
          upvotes?: number
        }
        Relationships: []
      }
      language_islands: {
        Row: {
          id: number
          topic_id: number
          name_fi: string
          name_en: string
          sort_order: number
          unlock_threshold: number
        }
        Insert: {
          id?: number
          topic_id: number
          name_fi: string
          name_en: string
          sort_order: number
          unlock_threshold?: number
        }
        Update: {
          name_fi?: string
          name_en?: string
          sort_order?: number
          unlock_threshold?: number
        }
        Relationships: []
      }
      island_sentences: {
        Row: {
          island_id: number
          sentence_id: number
          sort_order: number
        }
        Insert: {
          island_id: number
          sentence_id: number
          sort_order: number
        }
        Update: {
          sort_order?: number
        }
        Relationships: []
      }
      cards: {
        Row: {
          id: string
          user_id: string
          word_id: number | null
          sentence_id: number | null
          card_type: 'word_recognition' | 'word_production' | 'sentence_listening' | 'sentence_speaking'
          due: string
          stability: number
          difficulty: number
          elapsed_days: number
          scheduled_days: number
          reps: number
          lapses: number
          state: 'new' | 'learning' | 'review' | 'relearning'
          last_review: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          word_id?: number | null
          sentence_id?: number | null
          card_type: 'word_recognition' | 'word_production' | 'sentence_listening' | 'sentence_speaking'
          due?: string
          stability?: number
          difficulty?: number
          elapsed_days?: number
          scheduled_days?: number
          reps?: number
          lapses?: number
          state?: 'new' | 'learning' | 'review' | 'relearning'
          last_review?: string | null
          created_at?: string
        }
        Update: {
          due?: string
          stability?: number
          difficulty?: number
          elapsed_days?: number
          scheduled_days?: number
          reps?: number
          lapses?: number
          state?: 'new' | 'learning' | 'review' | 'relearning'
          last_review?: string | null
        }
        Relationships: []
      }
      review_logs: {
        Row: {
          id: string
          card_id: string
          user_id: string
          rating: 1 | 2 | 3 | 4
          state_before: 'new' | 'learning' | 'review' | 'relearning'
          stability_before: number
          difficulty_before: number
          elapsed_days: number
          scheduled_days: number
          review_time: string
        }
        Insert: {
          id?: string
          card_id: string
          user_id: string
          rating: 1 | 2 | 3 | 4
          state_before: 'new' | 'learning' | 'review' | 'relearning'
          stability_before: number
          difficulty_before: number
          elapsed_days: number
          scheduled_days: number
          review_time?: string
        }
        Update: never
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: {
      cefr_level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'
      card_state: 'new' | 'learning' | 'review' | 'relearning'
      card_type: 'word_recognition' | 'word_production' | 'sentence_listening' | 'sentence_speaking'
      dialect: 'standard' | 'colloquial'
      speaker_gender: 'M' | 'F'
    }
  }
}
