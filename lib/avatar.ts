// Deterministic avatar generation from a seed string.
// No uploads — every user gets a stable gradient + initials derived
// purely from their session id / avatar seed.

function hashString(seed: string): number {
  let h = 2166136261
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

const HUES = [265, 285, 305, 250, 220, 190, 330, 160, 25, 45]

export interface AvatarStyle {
  from: string
  to: string
  ring: string
}

export function avatarStyle(seed: string): AvatarStyle {
  const h = hashString(seed || 'anon')
  const hueA = HUES[h % HUES.length]
  const hueB = HUES[(h >> 3) % HUES.length]
  return {
    from: `oklch(0.68 0.2 ${hueA})`,
    to: `oklch(0.6 0.22 ${hueB})`,
    ring: `oklch(0.7 0.2 ${hueA})`,
  }
}

export function initials(nickname: string): string {
  const cleaned = nickname.trim()
  if (!cleaned) return '?'
  const parts = cleaned.split(/\s+/).filter(Boolean)
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase()
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

// A small pool for suggested random nicknames.
const ADJECTIVES = [
  'Cosmic', 'Neon', 'Silent', 'Rapid', 'Lucky', 'Hidden', 'Electric',
  'Velvet', 'Nimble', 'Crimson', 'Golden', 'Midnight', 'Wandering', 'Curious',
]
const NOUNS = [
  'Fox', 'Comet', 'Otter', 'Falcon', 'Pixel', 'Nomad', 'Raven', 'Tiger',
  'Willow', 'Echo', 'Drifter', 'Sparrow', 'Phoenix', 'Maple',
]

export function suggestNickname(): string {
  const a = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)]
  const n = NOUNS[Math.floor(Math.random() * NOUNS.length)]
  const num = Math.floor(Math.random() * 90) + 10
  return `${a}${n}${num}`
}
