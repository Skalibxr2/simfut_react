import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { httpRequest, setAuthToken } from '../api/httpClient.js'
import { clearSession, loadSession, persistSession } from './sessionStorage.js'

const SessionContext = createContext(null)

export function SessionProvider({ children }) {
  const [token, setToken] = useState(null)
  const [user, setUser] = useState(null)

  useEffect(() => {
    const saved = loadSession()
    if (saved?.token && saved?.user) {
      setToken(saved.token)
      setUser(saved.user)
      setAuthToken(saved.token)
    }
  }, [])

  const setSession = useCallback((nextToken, nextUser) => {
    setToken(nextToken)
    setUser(nextUser)
    setAuthToken(nextToken)
    if (nextToken && nextUser) {
      persistSession({ token: nextToken, user: nextUser })
    } else {
      clearSession()
    }
  }, [])

  const login = useCallback(async (credentials) => {
    const data = await httpRequest('/api/auth/login', {
      method: 'POST',
      body: credentials
    })
    const nextUser = { username: data.username, role: data.role }
    setSession(data.token, nextUser)
    return nextUser
  }, [setSession])

  const register = useCallback(async (payload) => {
    const data = await httpRequest('/api/auth/register', {
      method: 'POST',
      body: payload
    })
    const nextUser = { username: data.username, role: data.role }
    setSession(data.token, nextUser)
    return nextUser
  }, [setSession])

  const logout = useCallback(() => {
    setSession(null, null)
  }, [setSession])

  const authFetch = useCallback((path, options = {}) => httpRequest(path, options), [])

  const value = useMemo(() => ({
    token,
    user,
    isAuthenticated: Boolean(token),
    login,
    register,
    logout,
    authFetch
  }), [authFetch, login, logout, register, token, user])

  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  )
}

export function useSession() {
  const ctx = useContext(SessionContext)
  if (!ctx) {
    throw new Error('useSession debe usarse dentro de SessionProvider')
  }
  return ctx
}
