import { RoomCard } from '@/components/room-card'
import type { Room } from '@/lib/types'

export function RoomGrid({ rooms }: { rooms: Room[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {rooms.map((room, i) => (
        <div
          key={room.id}
          className="animate-fade-in-up"
          style={{ animationDelay: `${Math.min(i * 40, 320)}ms` }}
        >
          <RoomCard room={room} />
        </div>
      ))}
    </div>
  )
}
