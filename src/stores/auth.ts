import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'

interface UserProfile {
  id: string
  first_name: string
  phone: string
  instagram_id?: string
}

interface EventInfo {
  id: string
  code: string
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<UserProfile | null>(null)
  const event = ref<EventInfo | null>(null)
  const session = ref<{ access_token: string; refresh_token: string } | null>(null)
  const isAuthenticated = computed(() => !!user.value && !!session.value)

  // Restore session from localStorage on init
  function init() {
    const stored = localStorage.getItem('vb_auth')
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        user.value = parsed.user
        event.value = parsed.event
        session.value = parsed.session

        // Set the session on the Supabase client so RLS works
        if (parsed.session) {
          supabase.auth.setSession({
            access_token: parsed.session.access_token,
            refresh_token: parsed.session.refresh_token,
          })
        }
      } catch {
        localStorage.removeItem('vb_auth')
      }
    }
  }

  async function loginOrRegister(
    firstName: string,
    phone: string,
    pin: string,
    eventCode: string = 'BRINGUE2026'
  ) {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    const res = await fetch(`${supabaseUrl}/functions/v1/auth-gate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        first_name: firstName,
        phone,
        pin,
        event_code: eventCode,
      }),
    })

    const data = await res.json()

    if (!res.ok) {
      throw new Error(data.error || 'Erreur de connexion')
    }

    // Store in state
    user.value = data.user
    event.value = data.event
    session.value = data.session

    // Persist to localStorage
    localStorage.setItem('vb_auth', JSON.stringify({
      user: data.user,
      event: data.event,
      session: data.session,
    }))

    // Set the session on the Supabase client
    await supabase.auth.setSession({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
    })

    return data
  }

  function logout() {
    user.value = null
    event.value = null
    session.value = null
    localStorage.removeItem('vb_auth')
    supabase.auth.signOut()
  }

  return {
    user,
    event,
    session,
    isAuthenticated,
    init,
    loginOrRegister,
    logout,
  }
})
