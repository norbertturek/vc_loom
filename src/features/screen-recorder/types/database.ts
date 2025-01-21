export interface Recording {
  id: string
  user_id: string
  title: string
  url: string
  thumbnail_url?: string
  duration: number
  created_at: string
  updated_at: string
}

export interface Database {
  public: {
    Tables: {
      recordings: {
        Row: Recording
        Insert: Omit<Recording, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Recording, 'id' | 'created_at' | 'updated_at'>>
      }
    }
  }
} 