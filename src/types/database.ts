export interface Database {
  public: {
    Tables: {
      recordings: {
        Row: Recording
        Insert: Omit<Recording, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Recording, 'id'>>
      }
      comments: {
        Row: Comment
        Insert: Omit<Comment, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Comment, 'id'>>
      }
      share_links: {
        Row: ShareLink
        Insert: Omit<ShareLink, 'id' | 'created_at'>
        Update: Partial<Omit<ShareLink, 'id'>>
      }
      transcriptions: {
        Row: Transcription
        Insert: Omit<Transcription, 'id' | 'created_at'>
        Update: Partial<Omit<Transcription, 'id'>>
      }
    }
  }
}

export interface Recording {
  id: string
  user_id: string
  title: string
  url: string
  thumbnail_url: string | null
  duration: number
  created_at: string
  updated_at: string
}

export interface Comment {
  id: string
  recording_id: string
  user_id: string
  text: string
  timestamp: number
  created_at: string
  updated_at: string
}

export interface ShareLink {
  id: string
  recording_id: string
  token: string
  created_at: string
  expires_at: string | null
  created_by: string
}

export interface Transcription {
  id: string
  recording_id: string
  start_time: number
  end_time: number
  text: string
  created_at: string
} 