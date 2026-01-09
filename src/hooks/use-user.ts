import { LocalStorageKeys } from "@/enums/localstorage"
import * as React from "react"

export type UserInfo = {
  id?: string | number
  name?: string
  email?: string
  role?: { id: string; name: string; permissions: string[] }
  [key: string]: unknown
}

export function useUser() {
  const [user, setUserState] = React.useState<UserInfo | null>(null)

  React.useEffect(() => {
    if (typeof window === "undefined") return
    try {
      const raw = localStorage.getItem(LocalStorageKeys.User)
      if (raw) setUserState(JSON.parse(raw))
    } catch {
      setUserState(null)
    }
  }, [])

  const setUser = React.useCallback((next: UserInfo | null) => {
    if (typeof window === "undefined") return
    if (next) {
      setUserState(next)
      localStorage.setItem(LocalStorageKeys.User, JSON.stringify(next))
    } else {
      setUserState(null)
      localStorage.removeItem(LocalStorageKeys.User)
    }
  }, [])

  const clearUser = React.useCallback(() => setUser(null), [setUser])

  return { user, setUser, clearUser }
}

