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
  const session = ref<any | null>(null)
  const initialized = ref(false)
  const isAuthenticated = computed(() => !!user.value && !!session.value)

  // Initialize from native Supabase session + local metadata
  async function init() {
    // 1. Recover standard session from Supabase (native localStorage)
    const { data: { session: nativeSession } } = await supabase.auth.getSession()
    
    if (nativeSession) {
      session.value = nativeSession
      
      // 2. Recover metadata (User/Event) from our custom storage
      const stored = localStorage.getItem('vb_auth')
      if (stored) {
        try {
          const parsed = JSON.parse(stored)
          user.value = parsed.user
          event.value = parsed.event
        } catch {
          // Clear if corrupted
          localStorage.removeItem('vb_auth')
        }
      }

      // 3. Fallback: If we have a session but NO profile in vb_auth, fetch it
      if (!user.value) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', nativeSession.user.id)
          .single()
        if (profile) {
          user.value = profile as UserProfile
          // We don't have event here, but typically it should be in vb_auth
        }
      }
    }

    initialized.value = true

    // 4. Listen to auth changes (Refreshes, SignIns, SignOuts)
    supabase.auth.onAuthStateChange(async (eventMsg, newSession) => {
      console.log('Auth Event:', eventMsg)
      
      if (eventMsg === 'SIGNED_IN' || eventMsg === 'TOKEN_REFRESHED') {
        if (newSession) {
          session.value = newSession
          // Persist metadata if we have user
          if (user.value && event.value) {
            saveMetadata()
          }
        }
      } 
      
      if (eventMsg === 'SIGNED_OUT') {
        clearState()
      }
    })
  }

  function saveMetadata() {
    localStorage.setItem('vb_auth', JSON.stringify({
      user: user.value,
      event: event.value
    }))
  }

  function clearState() {
    user.value = null
    event.value = null
    session.value = null
    localStorage.removeItem('vb_auth')
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

    // Assign session to client (this will handle automatic persistence)
    await supabase.auth.setSession({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
    })

    // Fetch the latest profile from DB
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single()

    const finalUser = profile ? { ...data.user, ...profile } : data.user

    // Store in state
    user.value = finalUser
    event.value = data.event
    session.value = data.session

    // Persist only metadata (tokens are in Supabase storage)
    saveMetadata()

    // Assign random avatar if missing
    if (!finalUser.avatar_url) {
      const randomIndex = Math.floor(Math.random() * 9) + 1;
      const { data: updatedUser } = await supabase
        .from('profiles')
        .update({ avatar_url: String(randomIndex) })
        .eq('id', finalUser.id)
        .select()
        .single();
      
      if (updatedUser) {
        user.value = updatedUser;
        saveMetadata();
      }
    }

    return data
  }

  async function logout() {
    clearState()
    await supabase.auth.signOut()
  }

  return {
    user,
    event,
    session,
    isAuthenticated,
    init,
    loginOrRegister,
    logout,
    initialized
  }
})
