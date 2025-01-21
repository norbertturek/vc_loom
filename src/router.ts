import { createRouter, createWebHistory } from 'vue-router'
import { getSupabase } from '@/features/auth/lib/supabase'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      component: () => import('@/layouts/MainLayout.vue'),
      children: [
        {
          path: '',
          name: 'home',
          component: () => import('@/pages/HomePage.vue'),
          meta: { requiresGuest: true }
        },
        {
          path: 'login',
          name: 'login',
          component: () => import('@/pages/LoginPage.vue'),
          meta: { requiresGuest: true }
        },
        {
          path: 'register',
          name: 'register',
          component: () => import('@/pages/RegisterPage.vue'),
          meta: { requiresGuest: true }
        },
        {
          path: 'confirmation',
          name: 'confirmation',
          component: () => import('@/pages/ConfirmationPage.vue'),
          meta: { requiresGuest: true }
        },
        {
          path: 'recorder',
          name: 'recorder',
          component: () => import('@/pages/RecorderPage.vue'),
          meta: { requiresAuth: true }
        },
        {
          path: 'video/:videoId',
          name: 'video',
          component: () => import('@/pages/VideoPlayerPage.vue'),
          meta: { requiresAuth: true }
        }
      ]
    },
    {
      path: '/share/:videoId/:token',
      name: 'shared-video',
      component: () => import('@/pages/SharedVideoPage.vue')
    }
  ]
})

// Navigation guards
router.beforeEach(async (to) => {
  const supabase = getSupabase()
  
  // Handle confirmation hash
  if (window.location.hash.includes('access_token') && to.name !== 'confirmation') {
    return { name: 'confirmation' }
  }

  try {
    // Check auth state
    const { data: { session }, error } = await supabase.auth.getSession()
    
    // Handle auth errors
    if (error) {
      console.error('Auth error:', error)
      await supabase.auth.signOut()
      return { name: 'login' }
    }

    // Routes that require authentication
    if (to.meta.requiresAuth && !session) {
      return { name: 'login' }
    }
    
    // Routes that require guest (non-authenticated) access
    if (to.meta.requiresGuest && session) {
      return { name: 'recorder' }
    }
  } catch (error) {
    console.error('Navigation error:', error)
    return { name: 'login' }
  }
})

export default router 