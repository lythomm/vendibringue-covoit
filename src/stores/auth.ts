import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'

interface UserProfile {
  id: string
  first_name: string
  phone: string
  instagram_id?: string
  avatar_url?: string
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
    // Listen to token refreshes from Supabase so our local vb_auth doesn't get a stale refresh_token
    supabase.auth.onAuthStateChange((_event, newSession) => {
      if (newSession && user.value && event.value) {
        session.value = {
          access_token: newSession.access_token,
          refresh_token: newSession.refresh_token,
        }
        localStorage.setItem('vb_auth', JSON.stringify({
          user: user.value,
          event: event.value,
          session: session.value,
        }))
      }
    })

    const stored = localStorage.getItem('vb_auth')
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        user.value = parsed.user
        event.value = parsed.event
        session.value = parsed.session

        if (parsed.session) {
          // Only sync to Supabase if it doesn't already have an active session
          supabase.auth.getSession().then(({ data }) => {
            if (!data.session) {
              supabase.auth.setSession({
                access_token: parsed.session.access_token,
                refresh_token: parsed.session.refresh_token,
              })
            }
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

    // Set the session on the Supabase client
    await supabase.auth.setSession({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
    })

    // Fetch the latest profile from DB, as auth-gate might omit avatar_url
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single()

    if (profile) {
      data.user = { ...data.user, ...profile }
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

    // Assign random avatar if missing
    if (!data.user.avatar_url) {
      const randomIndex = Math.floor(Math.random() * 9) + 1;
      const { data: updatedUser } = await supabase
        .from('profiles')
        .update({ avatar_url: String(randomIndex) })
        .eq('id', data.user.id)
        .select()
        .single();
      
      if (updatedUser) {
        user.value = updatedUser;
        // Update localStorage with the new user data
        localStorage.setItem('vb_auth', JSON.stringify({
          user: updatedUser,
          event: data.event,
          session: data.session,
        }))
      }
    }

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
