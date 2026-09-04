'use client'

import { useEffect, useState } from 'react'
import { fetchRooms, subscribeRooms, fetchTotalOnline, totalOnline, usingSupabase } from '@/lib/backend'
import type { Room } from '@/lib/types'

export function useRooms() {
  const [rooms, setRooms] = useState<Room[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [online, setOnline] = useState(0)

  useEffect(() => {
    let active = true

    async function load() {
      try {
        const [data, onlineCount] = await Promise.all([
          fetchRooms(),
          usingSupabase ? fetchTotalOnline() : Promise.resolve(totalOnline()),
        ])
        if (!active) return
        setRooms(data)
        setOnline(onlineCount)
        setError(null)
      } catch {
        if (active) setError('We could not load rooms. Please try again.')
      }
    }

    load()
    const unsub = subscribeRooms(() => load())

    // Refresh online count periodically
    const interval = setInterval(async () => {
      if (!active) return
      try {
        const count = usingSupabase ? await fetchTotalOnline() : totalOnline()
        if (active) setOnline(count)
      } catch {}
    }, 10000)

    return () => {
      active = false
      unsub()
      clearInterval(interval)
    }
  }, [])

  return { rooms, online, error, loading: rooms === null }
}
