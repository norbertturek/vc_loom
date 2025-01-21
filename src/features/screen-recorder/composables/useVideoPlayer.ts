import { ref, computed } from 'vue'
import { getSupabase } from '@/features/auth/lib/supabase'
import type { Comment, Transcription, ShareLink } from '@/types/database'
import { useToast } from '@/components/ui/toast/use-toast'

export function useVideoPlayer(videoId: string) {
  const supabase = getSupabase()
  const { toast } = useToast()

  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const comments = ref<Comment[]>([])
  const transcription = ref<Transcription[]>([])
  const videoUrl = ref<string | null>(null)
  const shareLink = ref<string | null>(null)
  const title = ref<string>('')

  const sortedComments = computed(() => {
    return [...comments.value].sort((a, b) => a.timestamp - b.timestamp)
  })

  async function fetchVideoData() {
    try {
      isLoading.value = true
      error.value = null
      const { data, error: err } = await supabase
        .from('recordings')
        .select('url, title, transcriptions(*), comments(*)')
        .eq('id', videoId)
        .single()

      if (err) throw err
      if (!data) throw new Error('Recording not found')

      videoUrl.value = data.url
      title.value = data.title || 'Untitled Recording'
      
      // Convert timestamps from milliseconds to seconds and ensure they're properly formatted
      transcription.value = (data.transcriptions || []).map(t => ({
        ...t,
        start_time: Math.round(t.start_time / 1000), // Convert ms to seconds
        end_time: Math.round(t.end_time / 1000)     // Convert ms to seconds
      }))
      
      // Convert comment timestamps from milliseconds to seconds
      comments.value = (data.comments || []).map(c => ({
        ...c,
        timestamp: Math.round(c.timestamp / 1000) // Convert ms to seconds
      }))
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch video'
      console.error('Error fetching video:', err)
    } finally {
      isLoading.value = false
    }
  }

  async function updateTitle(newTitle: string) {
    try {
      const { error: err } = await supabase
        .from('recordings')
        .update({ title: newTitle })
        .eq('id', videoId)

      if (err) throw err
      title.value = newTitle
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to update title')
    }
  }

  async function addComment(text: string, timestamp: number) {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError) throw userError
      if (!user) throw new Error('User not authenticated')

      // Convert timestamp to integer (milliseconds)
      const timestampMs = Math.round(timestamp * 1000)

      const { data, error: commentError } = await supabase
        .from('comments')
        .insert({
          recording_id: videoId,
          user_id: user.id,
          text,
          timestamp: timestampMs,
        })
        .select()
        .single()

      if (commentError) throw commentError
      
      // Add the comment with the original timestamp (in seconds)
      comments.value.push({
        ...data,
        timestamp: timestamp // Use original timestamp in seconds
      })

      toast({
        title: 'Success',
        description: 'Comment added successfully'
      })
    } catch (err) {
      console.error('Error adding comment:', err)
      throw err
    }
  }

  async function deleteComment(commentId: string) {
    try {
      const { error: deleteError } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId)

      if (deleteError) throw deleteError
      comments.value = comments.value.filter(c => c.id !== commentId)

      toast({
        title: 'Success',
        description: 'Comment deleted successfully'
      })
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to delete comment',
        variant: 'destructive'
      })
      throw err
    }
  }

  async function fetchTranscription() {
    try {
      console.log('Fetching transcriptions for recording:', videoId)
      
      const { data, error: transcriptionError } = await supabase
        .from('transcriptions')
        .select('*')
        .eq('recording_id', videoId)
        .order('start_time')

      if (transcriptionError) {
        console.error('Error fetching transcriptions:', transcriptionError)
        throw transcriptionError
      }

      console.log('Raw transcription data:', data)
      
      // Convert timestamps from milliseconds to seconds
      transcription.value = data.map(t => ({
        ...t,
        start_time: t.start_time / 1000,
        end_time: t.end_time / 1000
      }))

      console.log('Processed transcriptions:', transcription.value)
    } catch (err) {
      console.error('Error loading transcription:', err)
      toast({
        title: 'Error',
        description: 'Failed to load transcription',
        variant: 'destructive'
      })
    }
  }

  async function generateShareLink() {
    try {
      // First, check if there's an existing non-expired share link
      const { data: existingLink } = await supabase
        .from('share_links')
        .select('token')
        .eq('recording_id', videoId)
        .gt('expires_at', new Date().toISOString())
        .maybeSingle()

      if (existingLink) {
        shareLink.value = existingLink.token
        return existingLink.token
      }

      // Create new share link
      const { data, error: shareError } = await supabase
        .from('share_links')
        .insert({
          recording_id: videoId,
          token: crypto.randomUUID(),
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
        })
        .select()
        .single()

      if (shareError) throw shareError
      shareLink.value = data.token
      return data.token
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to generate share link',
        variant: 'destructive'
      })
      throw err
    }
  }

  return {
    isLoading,
    error,
    videoUrl,
    comments: sortedComments,
    transcription,
    shareLink,
    title,
    fetchVideoData,
    addComment,
    deleteComment,
    generateShareLink,
    updateTitle
  }
} 