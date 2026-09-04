'use client'

import { useState } from 'react'
import { Flag, ShieldAlert } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field'
import { createReport } from '@/lib/backend'
import { REPORT_REASONS, type ReportReason } from '@/lib/types'
import { toast } from 'sonner'

export interface ReportTarget {
  type: 'message' | 'user'
  messageId?: string
  userId?: string
  nickname?: string
}

interface ReportModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  target: ReportTarget | null
  roomId: string
}

export function ReportModal({
  open,
  onOpenChange,
  target,
  roomId,
}: ReportModalProps) {
  const [reason, setReason] = useState<ReportReason>('Spam')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!target) return

    setSubmitting(true)
    try {
      await createReport({
        room_id: roomId,
        reported_user_id: target.userId ?? null,
        message_id: target.messageId ?? null,
        reason,
        description,
      })
      toast.success('Report submitted', {
        description: 'Thank you for helping keep TalkRoom safe.',
      })
      setDescription('')
      onOpenChange(false)
    } catch {
      toast.error('Failed to submit report', {
        description: 'Please try again later.',
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center gap-2">
            <ShieldAlert className="size-5 text-destructive" />
            <DialogTitle>
              {target?.type === 'user'
                ? `Report ${target.nickname || 'User'}`
                : 'Report Message'}
            </DialogTitle>
          </div>
          <DialogDescription>
            Reports are anonymous and reviewed to keep conversations safe and respectful.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Field>
            <FieldLabel>Reason</FieldLabel>
            <Select value={reason} onValueChange={(v) => setReason(v as ReportReason)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {REPORT_REASONS.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field>
            <FieldLabel htmlFor="report-details">Additional Details (optional)</FieldLabel>
            <Textarea
              id="report-details"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide any additional context..."
              rows={3}
              maxLength={300}
            />
            <FieldDescription>
              {description.length}/300 characters
            </FieldDescription>
          </Field>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" variant="destructive" disabled={submitting}>
              <Flag data-icon="inline-start" />
              {submitting ? 'Submitting…' : 'Submit Report'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
