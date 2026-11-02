import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id, session.user)
      } else {
        setLoading(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id, session.user)
      } else {
        setProfile(null)
        setLoading(false)
      }
    })

    return () => {
      mounted = false
      subscription?.unsubscribe?.()
    }
  }, [])

  const fetchProfile = async (userId, userObj = null) => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
      if (data) {
        setProfile(data)
      } else {
        const u = userObj || user
        const emailName = u?.email ? u.email.split('@')[0] : 'Pengguna'
        const capitalizedEmail = emailName.charAt(0).toUpperCase() + emailName.slice(1)
        const fallbackProfile = {
          id: userId,
          full_name: u?.user_metadata?.full_name || capitalizedEmail,
          business_name: u?.user_metadata?.business_name || `Usaha ${capitalizedEmail}`,
          email: u?.email || '',
        }
        setProfile(fallbackProfile)
      }
    } catch (err) {
      console.error('Error fetching profile:', err)
    } finally {
      setLoading(false)
    }
  }

  const signIn = async (email, password) => {
    const res = await supabase.auth.signInWithPassword({ email, password })
    if (res.error) throw res.error
    const loggedUser = res.data?.user || res.data?.session?.user
    if (loggedUser) {
      setUser(loggedUser)
      await fetchProfile(loggedUser.id, loggedUser)
    }
    return res.data
  }

  const signUp = async (email, password, metadata) => {
    const res = await supabase.auth.signUp({
      email,
      password,
      options: { data: metadata },
    })
    if (res.error) throw res.error
    const newUser = res.data?.user || res.data?.session?.user
    if (newUser) {
      setUser(newUser)
      await fetchProfile(newUser.id, newUser)
    }
    return res.data
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    setUser(null)
    setProfile(null)
  }

  const updateProfile = async (updates) => {
    if (!user) return
    const { data, error } = await supabase
      .from('profiles')
      .upsert({ id: user.id, ...updates })
      .select()
      .single()
    if (error) throw error
    setProfile(data)
    return data
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        signIn,
        signUp,
        signOut,
        updateProfile,
        fetchProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
