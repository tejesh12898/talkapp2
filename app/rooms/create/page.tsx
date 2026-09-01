'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sparkles, Eye, Lock, Unlock } from 'lucide-react'
import { Navbar } from '@/components/navbar'
import { SiteFooter } from '@/components/site-footer'
import { NicknameModal } from '@/components/nickname-modal'
import { RoomCard } from '@/components/room-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useSession } from '@/hooks/use-session'
import { createRoom } from '@/lib/backend'
import { genId } from '@/lib/session'
import { CATEGORIES, type Category, type Room } from '@/lib/types'
import {
  validateRoomName,
  ROOM_NAME_MAX,
  ROOM_DESC_MAX,
  genInviteCode,
} from '@/lib/validation'
import { toast } from 'sonner'

export default function CreateRoomPage() {
  const { session } = useSession()
  const router = useRouter()
  const [modalOpen, setModalOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<Category>('General')
  const [maxUsers, setMaxUsers] = useState(25)
  const [isPrivate, setIsPrivate] = useState(false)
  const [nameError, setNameError] = useState<string | null>(null)

  // Live preview room object
  const previewRoom: Room = {
    id: 'preview',
    name: name || 'Your Room Name',
    description: description || 'Add a description for your room.',
    category,
    owner_id: session?.id ?? 'preview',
    max_users: maxUsers,
    is_private: isPrivate,
    invite_code: isPrivate ? 'XXXXX' : null,
    is_discoverable: !isPrivate,
    is_locked: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    online_count: 0,
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!session) {
      setModalOpen(true)
      return
    }

    const validation = validateRoomName(name)
    if (!validation.ok) {
      setNameError(validation.error ?? 'Invalid name.')
      return
    }

    setSubmitting(true)

    try {
      const room = await createRoom({
        id: genId('room'),
        name: validation.value,
        description: description.trim().slice(0, ROOM_DESC_MAX),
        category,
        owner_id: session.id,
        max_users: maxUsers,
        is_private: isPrivate,
        invite_code: isPrivate ? genInviteCode() : null,
        is_discoverable: !isPrivate,
        is_locked: false,
      })

      toast.success('Room created!', { description: `"${room.name}" is ready to go.` })
      router.push(`/room/${room.id}`)
    } catch {
      toast.error('Failed to create room', { description: 'Please try again.' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <Navbar />
      <main className="flex-1">
        <div className="mx-auto w-full max-w-4xl px-4 py-8">
          <h1 className="text-3xl font-semibold tracking-tight">Create a Room</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Set up a space for conversation. It takes just a few seconds.
          </p>

          <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-5">
            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6 lg:col-span-3">
              <Card>
                <CardHeader>
                  <CardTitle>Room Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  {/* Name */}
                  <Field data-invalid={nameError ? true : undefined}>
                    <FieldLabel htmlFor="room-name">Room Name</FieldLabel>
                    <Input
                      id="room-name"
                      value={name}
                      maxLength={ROOM_NAME_MAX}
                      placeholder="e.g. Late Night Lounge"
                      onChange={(e) => {
                        setName(e.target.value)
                        if (nameError) setNameError(null)
                      }}
                    />
                    <FieldDescription>
                      {nameError ? (
                        <span className="text-destructive">{nameError}</span>
                      ) : (
                        `${name.length}/${ROOM_NAME_MAX} characters`
                      )}
                    </FieldDescription>
                  </Field>

                  {/* Description */}
                  <Field>
                    <FieldLabel htmlFor="room-desc">Description</FieldLabel>
                    <Textarea
                      id="room-desc"
                      value={description}
                      maxLength={ROOM_DESC_MAX}
                      placeholder="What's this room about?"
                      rows={3}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                    <FieldDescription>
                      {description.length}/{ROOM_DESC_MAX} characters
                    </FieldDescription>
                  </Field>

                  {/* Category */}
                  <Field>
                    <FieldLabel>Category</FieldLabel>
                    <Select
                      value={category}
                      onValueChange={(v) => setCategory(v as Category)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((c) => (
                          <SelectItem key={c} value={c}>
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>

                  {/* Max Users */}
                  <Field>
                    <FieldLabel htmlFor="max-users">Max Users</FieldLabel>
                    <div className="flex items-center gap-3">
                      <input
                        id="max-users"
                        type="range"
                        min={2}
                        max={100}
                        value={maxUsers}
                        onChange={(e) => setMaxUsers(Number(e.target.value))}
                        className="flex-1 accent-[var(--brand)]"
                      />
                      <Badge variant="secondary" className="tabular-nums">
                        {maxUsers}
                      </Badge>
                    </div>
                    <FieldDescription>
                      Between 2 and 100 people can join.
                    </FieldDescription>
                  </Field>

                  {/* Private toggle */}
                  <div className="flex items-center justify-between rounded-lg border border-border/60 p-4">
                    <div className="flex items-center gap-3">
                      {isPrivate ? (
                        <Lock className="size-5 text-muted-foreground" />
                      ) : (
                        <Unlock className="size-5 text-muted-foreground" />
                      )}
                      <div>
                        <p className="text-sm font-medium">Private Room</p>
                        <p className="text-xs text-muted-foreground">
                          Only people with the invite code can join.
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={isPrivate}
                      onCheckedChange={setIsPrivate}
                    />
                  </div>
                </CardContent>
              </Card>

              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={submitting}
              >
                <Sparkles data-icon="inline-start" />
                {submitting ? 'Creating…' : 'Create Room'}
              </Button>
            </form>

            {/* Live Preview */}
            <div className="lg:col-span-2">
              <div className="sticky top-20">
                <div className="flex items-center gap-2 mb-3">
                  <Eye className="size-4 text-muted-foreground" />
                  <h3 className="text-sm font-medium text-muted-foreground">Live Preview</h3>
                </div>
                <div className="pointer-events-none">
                  <RoomCard room={previewRoom} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />

      <NicknameModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onComplete={() => {
          // After signing in, allow form to be submitted
        }}
      />
    </div>
  )
}
