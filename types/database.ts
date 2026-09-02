export type UserRole = 'admin' | 'user';
export type BoardPermission = 'owner' | 'editor' | 'viewer';
export type MemberPermission = 'editor' | 'viewer';
export type SaveStatus = 'saved' | 'saving' | 'error' | 'offline';

export interface Profile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ExcalidrawSceneData {
  elements: any[];
  appState?: Record<string, any>;
  files?: Record<string, any>;
  revision?: number;
}

export interface Board {
  id: string;
  name: string;
  owner_id: string;
  scene_data: ExcalidrawSceneData;
  thumbnail_url?: string | null;
  created_at: string;
  updated_at: string;
  owner?: Profile;
  members?: BoardMember[];
  userPermission?: BoardPermission;
  tags?: Tag[];
}

export interface BoardMember {
  board_id: string;
  user_id: string;
  permission: MemberPermission;
  created_at: string;
  profile?: Profile;
}

export interface ShareLink {
  id: string;
  board_id: string;
  token_hash: string;
  permission: MemberPermission;
  is_active: boolean;
  expires_at: string | null;
  created_by: string;
  created_at: string;
}

export interface RealtimeCollaborator {
  id: string;
  name: string;
  email: string;
  color: string;
  cursor?: { x: number; y: number } | null;
  lastActive: number;
}

// ----------------------------------------------------
// Communication (V1.5)
// ----------------------------------------------------
export interface Channel {
  id: string;
  name: string;
  description?: string | null;
  is_private: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
  unreadCount?: number;
}

export interface DirectMessageConversation {
  id: string;
  user1_id: string;
  user2_id: string;
  created_at: string;
  updated_at: string;
  otherUser?: Profile;
}

export interface Message {
  id: string;
  channel_id?: string | null;
  dm_id?: string | null;
  parent_id?: string | null;
  sender_id: string;
  content: string;
  message_type: 'text' | 'code' | 'object_ref' | 'system';
  metadata?: {
    boardId?: string;
    boardName?: string;
    docId?: string;
    docTitle?: string;
    snippetId?: string;
    snippetTitle?: string;
    language?: string;
  } | null;
  is_edited: boolean;
  created_at: string;
  updated_at: string;
  sender?: Profile;
  attachments?: MessageAttachment[];
  reactions?: MessageReaction[];
  replyCount?: number;
}

export interface MessageAttachment {
  id: string;
  message_id: string;
  file_name: string;
  file_url: string;
  file_type: string;
  file_size: number;
  created_at: string;
}

export interface MessageReaction {
  message_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
}

// ----------------------------------------------------
// Knowledge & Snippets (V2)
// ----------------------------------------------------
export interface Document {
  id: string;
  title: string;
  content: string;
  owner_id: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  owner?: Profile;
  tags?: Tag[];
}

export interface CodeSnippet {
  id: string;
  title: string;
  language: string;
  code: string;
  description?: string | null;
  owner_id: string;
  created_at: string;
  updated_at: string;
  owner?: Profile;
  tags?: Tag[];
}

export interface Asset {
  id: string;
  title: string;
  file_name: string;
  file_url: string;
  mime_type: string;
  file_size: number;
  owner_id: string;
  created_at: string;
  owner?: Profile;
  tags?: Tag[];
}

export interface Tag {
  id: string;
  name: string;
  color: string;
  created_at: string;
}

export interface UniversalSearchResult {
  id: string;
  type: 'board' | 'document' | 'snippet' | 'asset' | 'message';
  title: string;
  snippet?: string;
  url: string;
  created_at: string;
  tags?: string[];
  metadata?: Record<string, any>;
}
