import { createRouter, createWebHistory } from 'vue-router'
import MainLayout from './layouts/MainLayout.vue'
import HomePage from './pages/HomePage.vue'
import LoginPage from './pages/LoginPage.vue'
import RegisterPage from './pages/RegisterPage.vue'
import RecorderPage from './pages/RecorderPage.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      component: MainLayout,
      children: [
        {
          path: '',
          component: HomePage
        },
        {
          path: 'login',
          component: LoginPage
        },
        {
          path: 'register',
          component: RegisterPage
        },
        {
          path: 'recorder',
          component: RecorderPage,
          meta: { requiresAuth: true }
        }
      ]
    }
  ]
})

// Simple auth guard
router.beforeEach((to, from, next) => {
  // Mock auth check - replace with actual auth logic
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true'
  
  if (to.meta.requiresAuth && !isAuthenticated) {
    next('/login')
  } else {
    next()
  }
})

export default router 