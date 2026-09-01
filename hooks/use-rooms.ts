'use client'

import { useEffect, useState } from 'react'
import { fetchRooms, subscribeRooms, totalOnline, usingSupabase } from '@/lib/backend'
import type { Room } from '@/lib/types'

export function useRooms() {
  const [rooms, setRooms] = useState<Room[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [online, setOnline] = useState(0)

  useEffect(() => {
    let active = true

    async function load() {
      try {
        const data = await fetchRooms()
        if (!active) return
        setRooms(data)
        setOnline(usingSupabase ? 0 : totalOnline())
        setError(null)
      } catch {
        if (active) setError('We could not load rooms. Please try again.')
      }
    }

    load()
    const unsub = subscribeRooms(() => load())
    // keep the live online count ticking for the mock backend
    const interval = usingSupabase ? null : setInterval(() => setOnline(totalOnline()), 3000)

    return () => {
      active = false
      unsub()
      if (interval) clearInterval(interval)
    }
  }, [])

  return { rooms, online, error, loading: rooms === null }
}
