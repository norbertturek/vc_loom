import { ref } from 'vue'
import { getSupabase } from '@/features/auth/lib/supabase'
import type { Recording } from '../types/database'

interface RecordingsState {
  recordings: Recording[]
  loading: boolean
  error: string | null
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: (event: SpeechRecognitionEvent) => void;
  onstart: () => void;
  onend: () => void;
  onerror: (event: { error: string }) => void;
  start(): void;
  stop(): void;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

export function useRecordings() {
  const state = ref<RecordingsState>({
    recordings: [],
    loading: false,
    error: null
  })

  const supabase = getSupabase()

  async function generateTranscription(recordingId: string, transcripts: Array<{
    start_time: number,
    end_time: number,
    text: string
  }>) {
    try {
      console.log('Saving transcripts for recording:', recordingId)
      console.log('Transcripts:', transcripts)

      if (transcripts.length === 0) {
        console.log('No transcripts available for recording')
        return
      }

      // Convert timestamps to milliseconds and add recording_id
      const transcriptions = transcripts.map(t => ({
        recording_id: recordingId,
        start_time: t.start_time,
        end_time: t.end_time,
        text: t.text
      }))

      const { data, error: transcriptionError } = await supabase
        .from('transcriptions')
        .insert(transcriptions)
        .select()

      if (transcriptionError) {
        console.error('Transcription error:', transcriptionError)
        throw transcriptionError
      }

      console.log('Transcriptions saved successfully:', data)
    } catch (err) {
      console.error('Error saving transcriptions:', err)
      throw err // Re-throw to handle in the caller
    }
  }

  async function uploadRecording(
    file: Blob, 
    title: string,
    transcripts: Array<{
      start_time: number,
      end_time: number,
      text: string
    }>
  ): Promise<string> {
    try {
      state.value.loading = true
      state.value.error = null

      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError) throw userError
      if (!user) throw new Error('User not authenticated')

      console.log('Uploading recording for user:', user.id)

      // Upload to storage
      const fileName = `${user.id}/${Date.now()}.webm`
      console.log('Uploading file:', fileName)
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('recordings')
        .upload(fileName, file, {
          contentType: 'video/webm',
          cacheControl: '3600'
        })

      if (uploadError) {
        console.error('Storage upload error:', uploadError)
        throw uploadError
      }

      console.log('File uploaded successfully:', uploadData)

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('recordings')
        .getPublicUrl(fileName)

      console.log('Public URL:', publicUrl)

      // Create record in database
      const { data: recordData, error: dbError } = await supabase
        .from('recordings')
        .insert({
          user_id: user.id,
          title,
          url: publicUrl,
          duration: 60 // Default duration for now
        })
        .select()
        .single()

      if (dbError) {
        console.error('Database insert error:', dbError)
        throw dbError
      }

      console.log('Recording saved to database:', recordData)

      // Generate transcription from the actual video content
      await generateTranscription(recordData.id, transcripts)

      // Refresh recordings list
      await fetchRecordings()

      // Return the recording ID
      return recordData.id
    } catch (err) {
      console.error('Error uploading recording:', err)
      state.value.error = err instanceof Error ? err.message : 'Failed to upload recording'
      throw err
    } finally {
      state.value.loading = false
    }
  }

  async function fetchRecordings() {
    try {
      state.value.loading = true
      state.value.error = null

      const { data, error } = await supabase
        .from('recordings')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      state.value.recordings = data
    } catch (err) {
      console.error('Error fetching recordings:', err)
      state.value.error = err instanceof Error ? err.message : 'Failed to fetch recordings'
    } finally {
      state.value.loading = false
    }
  }

  async function deleteRecording(id: string) {
    try {
      state.value.loading = true
      state.value.error = null

      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError) throw userError
      if (!user) throw new Error('User not authenticated')

      // Get recording details first
      const { data: recording, error: fetchError } = await supabase
        .from('recordings')
        .select('*')
        .eq('id', id)
        .single()

      if (fetchError) throw fetchError
      if (!recording) throw new Error('Recording not found')

      // Extract filename from URL
      const fileName = `${user.id}/${recording.url.split('/').pop()}`
      console.log('Deleting file from storage:', fileName)

      // Delete from storage first
      const { error: storageError } = await supabase.storage
        .from('recordings')
        .remove([fileName])

      if (storageError) {
        console.error('Storage deletion error:', storageError)
        throw storageError
      }

      // Then delete from database
      const { error: dbError } = await supabase
        .from('recordings')
        .delete()
        .eq('id', id)

      if (dbError) throw dbError

      // Remove from local state
      state.value.recordings = state.value.recordings.filter(r => r.id !== id)
      
      console.log('Recording deleted successfully')
    } catch (err) {
      console.error('Error deleting recording:', err)
      state.value.error = err instanceof Error ? err.message : 'Failed to delete recording'
    } finally {
      state.value.loading = false
    }
  }

  return {
    state,
    uploadRecording,
    fetchRecordings,
    deleteRecording
  }
} 