import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const session = ref(null)

  function setSession(newSession: any) {
    session.value = newSession
    user.value = newSession?.user ?? null
  }

  return {
    user,
    session,
    setSession
  }
})
