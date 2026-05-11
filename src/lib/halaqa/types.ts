export type Profile = {
  id: string
  username: string
  display_name: string
  avatar_url: string | null
  bio: string | null
  created_at: string
  updated_at: string
}

export type FriendshipStatus = 'pending' | 'accepted' | 'blocked'

export type FriendshipRow = {
  id: string
  user_a: string
  user_b: string
  requested_by: string
  status: FriendshipStatus
  created_at: string
  accepted_at: string | null
}

export type Friendship = FriendshipRow & {
  friend: Profile
  direction: 'incoming' | 'outgoing' | 'mutual'
}

export type RoomKind = 'recitation' | 'reminder' | 'story' | 'mixed'

export type Room = {
  id: string
  owner_id: string
  title: string
  description: string | null
  kind: RoomKind
  is_group: boolean
  scheduled_at: string | null
  created_at: string
  updated_at: string
}

export type RoomWithMembers = Room & {
  members: RoomMember[]
  owner: Profile | null
}

export type RoomMember = {
  room_id: string
  user_id: string
  role: 'host' | 'member'
  joined_at: string
  profile: Profile | null
}

export type RoomMessageKind = 'text' | 'audio' | 'system'

export type RoomMessage = {
  id: string
  room_id: string
  user_id: string
  kind: RoomMessageKind
  content: string | null
  audio_path: string | null
  duration_ms: number | null
  created_at: string
  author?: Profile | null
}

export type RoomSession = {
  id: string
  room_id: string
  started_by: string
  started_at: string
  ended_at: string | null
}
