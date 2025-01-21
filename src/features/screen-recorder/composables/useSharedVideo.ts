import { ref } from 'vue'
import { getSupabase } from '@/features/auth/lib/supabase'
import type { Comment, Transcription } from '@/types/database'
import { useToast } from '@/components/ui/toast/use-toast'

export function useSharedVideo(videoId: string, token: string) {
  const supabase = getSupabase()
  const { toast } = useToast()

  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const comments = ref<Comment[]>([])
  const transcription = ref<Transcription[]>([])
  const videoUrl = ref<string | null>(null)

  async function validateShareLink() {
    try {
      isLoading.value = true
      error.value = null

      const { data: shareLink, error: shareError } = await supabase
        .from('share_links')
        .select('recording_id')
        .eq('recording_id', videoId)
        .eq('token', token)
        .gt('expires_at', new Date().toISOString())
        .maybeSingle()

      if (shareError) throw shareError
      if (!data) throw new Error('Invalid or expired share link')

      // Set the share token for RLS policies
      await supabase.rpc('set_share_token', { token })

      return true
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Invalid share link'
      toast({
        title: 'Error',
        description: error.value,
        variant: 'destructive'
      })
      return false
    } finally {
      isLoading.value = false
    }
  }

  async function fetchSharedVideoData() {
    try {
      isLoading.value = true
      error.value = null

      const { data: recording, error: recordingError } = await supabase
        .from('recordings')
        .select('url')
        .eq('id', videoId)
        .single()

      if (recordingError) throw recordingError
      if (!recording) throw new Error('Video not found')

      videoUrl.value = recording.url

      await Promise.all([
        fetchComments(),
        fetchTranscription()
      ])
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load video'
      toast({
        title: 'Error',
        description: error.value,
        variant: 'destructive'
      })
    } finally {
      isLoading.value = false
    }
  }

  async function fetchComments() {
    try {
      const { data, error: commentsError } = await supabase
        .from('comments')
        .select('*')
        .eq('recording_id', videoId)
        .order('timestamp')

      if (commentsError) throw commentsError
      comments.value = data
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to load comments',
        variant: 'destructive'
      })
    }
  }

  async function fetchTranscription() {
    try {
      const { data, error: transcriptionError } = await supabase
        .from('transcriptions')
        .select('*')
        .eq('recording_id', videoId)
        .order('start_time')

      if (transcriptionError) throw transcriptionError
      transcription.value = data
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to load transcription',
        variant: 'destructive'
      })
    }
  }

  return {
    isLoading,
    error,
    videoUrl,
    comments,
    transcription,
    validateShareLink,
    fetchSharedVideoData
  }
} 