import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import HomeView from '../views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
      meta: { requiresAuth: true },
    },
    {
      path: '/auth',
      name: 'auth',
      component: () => import('../views/AuthView.vue'),
    },
  ],
})

router.beforeEach((to) => {
  const auth = useAuthStore()

  // Initialize from localStorage on first navigation
  if (!auth.isAuthenticated) {
    auth.init()
  }

  // Redirect to auth if not authenticated and route requires it
  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return { name: 'auth' }
  }

  // Redirect away from auth if already authenticated
  if (to.name === 'auth' && auth.isAuthenticated) {
    return { name: 'home' }
  }
})

export default router
