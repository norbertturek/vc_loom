import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { getSupabase } from '../lib/supabase'
import type { AuthState, SignUpData, SignInData } from '../types'

// Create shared reactive state
const state = ref<AuthState>({
  user: null,
  loading: false,
  error: null
})

export function useAuth() {
  const router = useRouter()
  const supabase = getSupabase()

  // Computed properties to access state
  const user = computed(() => state.value.user)
  const loading = computed(() => state.value.loading)
  const error = computed(() => state.value.error)

  async function getUser() {
    try {
      state.value.loading = true
      state.value.error = null
      
      const { data: { user: currentUser }, error: getUserError } = await supabase.auth.getUser()
      
      // Don't throw error if no session exists
      if (getUserError && getUserError.message !== 'Auth session missing!') {
        throw getUserError
      }
      
      state.value.user = currentUser
      return currentUser
    } catch (e) {
      console.error('Error getting user:', e)
      state.value.user = null
      state.value.error = (e as Error).message
      return null
    } finally {
      state.value.loading = false
    }
  }

  async function signUp({ email, password, full_name }: SignUpData) {
    try {
      state.value.loading = true
      state.value.error = null
      
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/confirmation`,
          data: {
            full_name: full_name || email.split('@')[0]
          }
        }
      })

      if (signUpError) throw signUpError

      if (data?.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            email: data.user.email,
            created_at: new Date().toISOString()
          })

        if (profileError) {
          console.error('Profile creation error:', profileError)
        }

        state.value.error = 'Please check your email for the confirmation link'
      }
    } catch (e) {
      console.error('Signup error:', e)
      state.value.error = (e as Error).message
    } finally {
      state.value.loading = false
    }
  }

  async function signIn({ email, password }: SignInData) {
    try {
      state.value.loading = true
      state.value.error = null
      
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (signInError) throw signInError

      state.value.user = data.user
      await router.push('/recorder')
    } catch (e) {
      console.error('Sign in error:', e)
      state.value.error = (e as Error).message
      state.value.user = null
    } finally {
      state.value.loading = false
    }
  }

  async function signOut() {
    try {
      state.value.loading = true
      state.value.error = null
      
      const { error: signOutError } = await supabase.auth.signOut()
      if (signOutError) throw signOutError

      state.value.user = null
      await router.push('/')
    } catch (e) {
      console.error('Sign out error:', e)
      state.value.error = (e as Error).message
    } finally {
      state.value.loading = false
    }
  }

  // Initialize auth listener
  supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
      state.value.user = session?.user || null
    } else if (event === 'SIGNED_OUT') {
      state.value.user = null
    }
  })

  return {
    user,
    loading,
    error,
    getUser,
    signUp,
    signIn,
    signOut
  }
} 