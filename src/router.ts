import { createRouter, createWebHistory } from 'vue-router'
import supabase from '@/features/auth/lib/supabase'

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
          component: () => import('@/pages/HomePage.vue')
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
        }
      ]
    }
  ]
})

// Navigation guards
router.beforeEach(async (to) => {
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