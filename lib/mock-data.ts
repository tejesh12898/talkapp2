import type { Category, Message, Room } from './types'

// A pool of ambient "residents" that keep mock rooms feeling alive.
export interface Bot {
  user_id: string
  nickname: string
  avatar_seed: string
}

export const BOTS: Bot[] = [
  { user_id: 'bot_1', nickname: 'NeonFox42', avatar_seed: 'bot_1' },
  { user_id: 'bot_2', nickname: 'MidnightEcho', avatar_seed: 'bot_2' },
  { user_id: 'bot_3', nickname: 'PixelNomad', avatar_seed: 'bot_3' },
  { user_id: 'bot_4', nickname: 'VelvetRaven', avatar_seed: 'bot_4' },
  { user_id: 'bot_5', nickname: 'LuckyOtter', avatar_seed: 'bot_5' },
  { user_id: 'bot_6', nickname: 'CosmicWillow', avatar_seed: 'bot_6' },
  { user_id: 'bot_7', nickname: 'RapidComet', avatar_seed: 'bot_7' },
  { user_id: 'bot_8', nickname: 'SilentMaple', avatar_seed: 'bot_8' },
  { user_id: 'bot_9', nickname: 'GoldenSparrow', avatar_seed: 'bot_9' },
  { user_id: 'bot_10', nickname: 'CuriousDrifter', avatar_seed: 'bot_10' },
]

export const AMBIENT_LINES: Record<string, string[]> = {
  General: [
    'anyone else just chilling tonight?',
    'good vibes in here honestly',
    'where is everyone from?',
    "lol that's actually wild",
    'brb grabbing coffee',
    'this room moves fast haha',
  ],
  Gaming: [
    'anyone up for ranked later?',
    'that last patch was rough ngl',
    'controller or mouse+kb?',
    'servers finally back up',
    'gg that was clutch',
  ],
  Music: [
    'what are you all listening to rn?',
    'new album goes so hard',
    'need some study playlist recs',
    'vinyl or streaming?',
    'that bassline is insane',
  ],
  Technology: [
    'anyone tried the new framework release?',
    'my build times are finally reasonable',
    'hot take: tabs > spaces',
    'shipping on a friday, wish me luck',
    'the AI stuff is moving so fast',
  ],
  Movies: [
    'no spoilers but that ending??',
    'rewatching the classics tonight',
    'best sci-fi of the decade, go',
    'the cinematography carried it',
  ],
  Random: [
    'ask me anything i guess',
    'pineapple on pizza: yes',
    'it is way too late to be awake',
    'random fact: octopuses have three hearts',
  ],
}

export function ambientLine(category: Category): string {
  const pool = AMBIENT_LINES[category] ?? AMBIENT_LINES.General
  return pool[Math.floor(Math.random() * pool.length)]
}

function iso(minutesAgo: number): string {
  return new Date(Date.now() - minutesAgo * 60_000).toISOString()
}

// Seed rooms. owner_id 'seed' marks non-editable community rooms.
export const SEED_ROOMS: Room[] = [
  {
    id: 'lounge',
    name: 'Late Night Lounge',
    description: 'Unwind, chat, and meet people who are also up too late.',
    category: 'General',
    owner_id: 'seed',
    max_users: 50,
    is_private: false,
    invite_code: null,
    is_discoverable: true,
    is_locked: false,
    created_at: iso(240),
    updated_at: iso(1),
    online_count: 38,
  },
  {
    id: 'gg',
    name: 'GG Central',
    description: 'Squad up, talk builds, and find people to play with.',
    category: 'Gaming',
    owner_id: 'seed',
    max_users: 40,
    is_private: false,
    invite_code: null,
    is_discoverable: true,
    is_locked: false,
    created_at: iso(180),
    updated_at: iso(2),
    online_count: 31,
  },
  {
    id: 'nowplaying',
    name: 'Now Playing',
    description: 'Share what you are listening to and swap recommendations.',
    category: 'Music',
    owner_id: 'seed',
    max_users: 30,
    is_private: false,
    invite_code: null,
    is_discoverable: true,
    is_locked: false,
    created_at: iso(120),
    updated_at: iso(1),
    online_count: 22,
  },
  {
    id: 'devs',
    name: 'Dev Talk',
    description: 'Code, tools, and the occasional cursed bug story.',
    category: 'Technology',
    owner_id: 'seed',
    max_users: 25,
    is_private: false,
    invite_code: null,
    is_discoverable: true,
    is_locked: false,
    created_at: iso(90),
    updated_at: iso(3),
    online_count: 19,
  },
  {
    id: 'screening',
    name: 'The Screening Room',
    description: 'Movie takes, reviews, and what to watch next.',
    category: 'Movies',
    owner_id: 'seed',
    max_users: 20,
    is_private: false,
    invite_code: null,
    is_discoverable: true,
    is_locked: false,
    created_at: iso(60),
    updated_at: iso(6),
    online_count: 12,
  },
  {
    id: 'chaos',
    name: 'Chaos Zone',
    description: 'No topic. No rules. Just vibes and randomness.',
    category: 'Random',
    owner_id: 'seed',
    max_users: 15,
    is_private: false,
    invite_code: null,
    is_discoverable: true,
    is_locked: false,
    created_at: iso(30),
    updated_at: iso(1),
    online_count: 14,
  },
  {
    id: 'campus',
    name: 'Campus Commons',
    description: 'For students: classes, dorm life, and finals survival.',
    category: 'College',
    owner_id: 'seed',
    max_users: 30,
    is_private: false,
    invite_code: null,
    is_discoverable: true,
    is_locked: false,
    created_at: iso(20),
    updated_at: iso(4),
    online_count: 9,
  },
  {
    id: 'memes',
    name: 'Meme Dispensary',
    description: 'Certified fresh nonsense, dispensed 24/7.',
    category: 'Memes',
    owner_id: 'seed',
    max_users: 40,
    is_private: false,
    invite_code: null,
    is_discoverable: true,
    is_locked: false,
    created_at: iso(12),
    updated_at: iso(1),
    online_count: 27,
  },
]

export function seedMessages(room: Room): Message[] {
  const picks = [BOTS[0], BOTS[1], BOTS[2], BOTS[3]]
  const lines = AMBIENT_LINES[room.category] ?? AMBIENT_LINES.General
  const msgs: Message[] = [
    {
      id: `sys_${room.id}_created`,
      room_id: room.id,
      user_id: 'system',
      nickname: 'system',
      avatar_seed: 'system',
      content: `Welcome to ${room.name}`,
      created_at: iso(15),
      kind: 'system',
    },
  ]
  for (let i = 0; i < 5; i++) {
    const bot = picks[i % picks.length]
    msgs.push({
      id: `seed_${room.id}_${i}`,
      room_id: room.id,
      user_id: bot.user_id,
      nickname: bot.nickname,
      avatar_seed: bot.avatar_seed,
      content: lines[i % lines.length],
      created_at: iso(12 - i * 2),
      kind: 'user',
    })
  }
  return msgs
}
