import { ref } from 'vue'
import { getSupabase } from '@/features/auth/lib/supabase'
import type { Recording } from '../types/database'

interface RecordingsState {
  recordings: Recording[]
  loading: boolean
  error: string | null
}

export function useRecordings() {
  const state = ref<RecordingsState>({
    recordings: [],
    loading: false,
    error: null
  })

  const supabase = getSupabase()

  async function uploadRecording(file: Blob, title: string) {
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
          duration: 0
        })
        .select()
        .single()

      if (dbError) {
        console.error('Database insert error:', dbError)
        throw dbError
      }

      console.log('Recording saved to database:', recordData)

      // Refresh recordings list
      await fetchRecordings()
    } catch (err) {
      console.error('Error uploading recording:', err)
      state.value.error = err instanceof Error ? err.message : 'Failed to upload recording'
      throw err // Re-throw to handle in the component
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

      // Get recording details
      const { data: recording } = await supabase
        .from('recordings')
        .select('url')
        .eq('id', id)
        .single()

      if (recording) {
        // Delete from storage
        const fileName = recording.url.split('/').pop()
        if (fileName) {
          await supabase.storage
            .from('recordings')
            .remove([fileName])
        }
      }

      // Delete from database
      const { error } = await supabase
        .from('recordings')
        .delete()
        .eq('id', id)

      if (error) throw error

      // Refresh recordings list
      await fetchRecordings()
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