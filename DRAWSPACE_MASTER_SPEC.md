# DrawSpace — Master Product & Engineering Specification

> **Product:** DrawSpace  
> **Status:** Approved Master Architecture & Engineering Roadmap  
> **Author / Role:** CTO & Lead Architect  
> **Stack:** Next.js (App Router) • TypeScript • Tailwind CSS • `@excalidraw/excalidraw` • Supabase (Auth, Postgres, Realtime, Storage) • Vercel • GitHub  

---

## 1. Executive Vision & Core Philosophy

**DrawSpace** is a private, real-time technical collaboration workspace designed for trusted teams (initial 4–5 core users, scalable to dozens). It unifies visual whiteboarding, contextual real-time communication, lightweight knowledge management, code snippets, and universal search into a single coherent desktop-first platform.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                  DRAWSPACE                                  │
├───────────────────────┬────────────────────────────┬────────────────────────┤
│   WHITEBOARDS (V1)    │     COMMUNICATION (V1.5)   │     KNOWLEDGE (V2)     │
│  - Excalidraw Engine  │  - Public/Private Channels │  - Lightweight Docs    │
│  - Realtime Broadcast │  - Direct Messages (DMs)   │  - First-Class Snippets│
│  - Multi-user Presence│  - Threads & Reactions     │  - Named Asset Library │
│  - Autosave & History │  - Drag & Drop Uploads     │  - Universal Search    │
│  - Granular Access    │  - Clipboard Paste Attach  │  - Object Cross-Links  │
├───────────────────────┴────────────────────────────┴────────────────────────┤
│                     UNIVERSAL METADATA & GRAPH LAYER                        │
│          Stable Object IDs (`/board/`, `/doc/`, `/snippet/`, `/msg/`)       │
│                  Tags (`#dsa`, `#system-design`, `#backend`)                │
├─────────────────────────────────────────────────────────────────────────────┤
│                      INFRASTRUCTURE & SECURITY LAYER                        │
│   PostgreSQL (RLS) • Supabase Auth • Supabase Realtime • Supabase Storage   │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Core Engineering Principles
1. **Never Reinvent Mature Engines**: Embed Excalidraw for drawings, Supabase for auth/realtime/storage, and standard web cryptographic primitives for tokens. DrawSpace builds the workspace, coordination, persistence, permissions, and knowledge layer around them.
2. **Private by Default**: Content is strictly isolated to its creator unless explicitly shared with specific users, channel members, or through cryptographically hashed share links.
3. **Everything is a Linkable Object**: Every board, document, code snippet, chat message, and asset has a deterministic UUID and URL pattern (`/board/:id`, `/documents/:id`, `/snippets/:id`, `/chat/:channelId?msg=:msgId`), allowing effortless cross-referencing.
4. **Strict Server-Side Security Boundary**: The frontend UI is never the security boundary. PostgreSQL Row Level Security (RLS) policies and server-side Route Handlers/Server Actions enforce access control.
5. **Durable vs. Ephemeral Data Isolation**: High-frequency transient updates (cursor movements, live stroke broadcasts, typing indicators) use ephemeral WebSocket messages. Durable states (scene snapshots, chat history, documents, snippets) persist via debounced and parameterized database pipelines.

---

## 2. Competitive & Architectural Reference Analysis

| Reference Product | Architectural Strength Borrowed | Anti-Pattern Explicitly Avoided |
|---|---|---|
| **Excalidraw** | Canvas UX, coordinate engine, JSON scene representation, SVG export | Rebuilding custom canvas math or forking the entire web app |
| **Linear / Slack** | Deterministic keyboard shortcuts, channel/DM hierarchy, rich thread replies | Bloated enterprise plugin sprawl, slow web clients |
| **Notion / Outline** | Fast markdown-first document authoring, deep linking between entities | Complex block-tree database overhead that hurts simplicity and performance |
| **GitHub Gists** | First-class snippet model with language syntax highlighting and raw copy | Storing code as unformatted, unsearchable chat plain text |
| **Miro / FigJam** | Real-time presence avatars, participant color tags, collaborator follow-mode | Heavy canvas payload sizes and high memory consumption |

---

## 3. Phased Implementation Roadmap

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│     PHASE 1     │ ──► │    PHASE 1.5    │ ──► │     PHASE 2     │ ──► │     PHASE 3     │
│   V1 Core Board │     │ Communication   │     │ Knowledge Base  │     │ Ecosystem/Mkt   │
└─────────────────┘     └─────────────────┘     └─────────────────┘     └─────────────────┘
 • Excalidraw Canvas     • Channels (#dsa,..)    • Markdown Documents    • Board Templates
 • Supabase Auth/RLS     • Direct Messages       • First-Class Snippets  • Component Library
 • Admin User Control    • Message Threads       • Named Asset Library   • Export Packs
 • Realtime Broadcast    • Drag & Drop Files     • Cross-Object Linking  • Webhooks & Bots
 • Debounced Autosave    • Paste Attachments     • Universal Search      • Multi-org Tenancy
 • Member Permissions    • Emoji Reactions       • Unified #Tags
 • SHA-256 Share Links   • Unread Badges         • Filter Views
```

---

## 4. Complete Database Architecture

### 4.1 Phase 1: Core Collaboration Schema (`001_initial_schema.sql`)
- **`profiles`**: `id` (PK, references `auth.users`), `name`, `email`, `role` (`'admin' | 'user'`), `is_active`, `created_at`, `updated_at`.
- **`boards`**: `id` (UUID PK), `name`, `owner_id` (references `profiles`), `scene_data` (JSONB containing elements, appState, files), `thumbnail_url`, `created_at`, `updated_at`.
- **`board_members`**: `board_id` (FK), `user_id` (FK), `permission` (`'viewer' | 'editor'`), `created_at`. PK `(board_id, user_id)`.
- **`share_links`**: `id` (UUID PK), `board_id` (FK), `token_hash` (TEXT UNIQUE, SHA-256), `permission` (`'viewer' | 'editor'`), `is_active`, `expires_at`, `created_by` (FK), `created_at`.

### 4.2 Phase 1.5: Real-time Communication Schema (`002_communication_schema.sql`)
- **`channels`**: `id` (UUID PK), `name` (e.g. `'general'`, `'dsa'`), `description`, `is_private` (BOOLEAN), `created_by` (FK), `created_at`.
- **`channel_members`**: `channel_id` (FK), `user_id` (FK), `role` (`'admin' | 'member'`), `last_read_at`, `created_at`. PK `(channel_id, user_id)`.
- **`direct_message_conversations`**: `id` (UUID PK), `user1_id` (FK), `user2_id` (FK), `updated_at`, `created_at`.
- **`messages`**: `id` (UUID PK), `channel_id` (FK NULL), `dm_id` (FK NULL), `parent_id` (FK NULL for threads), `sender_id` (FK), `content` (TEXT), `message_type` (`'text' | 'code' | 'object_ref' | 'system'`), `metadata` (JSONB for object references), `is_edited`, `created_at`, `updated_at`.
- **`message_attachments`**: `id` (UUID PK), `message_id` (FK), `file_name`, `file_url`, `file_type`, `file_size`, `created_at`.
- **`message_reactions`**: `message_id` (FK), `user_id` (FK), `emoji` (TEXT), `created_at`. PK `(message_id, user_id, emoji)`.

### 4.3 Phase 2: Knowledge, Snippets & Search Schema (`003_knowledge_and_search_schema.sql`)
- **`documents`**: `id` (UUID PK), `title`, `content` (Markdown text), `owner_id` (FK), `is_public`, `created_at`, `updated_at`.
- **`code_snippets`**: `id` (UUID PK), `title`, `language` (e.g. `'typescript'`, `'python'`, `'java'`, `'rust'`, `'sql'`, `'cpp'`), `code` (TEXT), `description`, `owner_id` (FK), `created_at`, `updated_at`.
- **`assets`**: `id` (UUID PK), `title`, `file_name`, `file_url`, `mime_type`, `file_size`, `owner_id` (FK), `created_at`.
- **`tags`**: `id` (UUID PK), `name` (TEXT UNIQUE, e.g. `'dsa'`, `'system-design'`, `'backend'`), `color` (TEXT), `created_at`.
- **`entity_tags`**: `tag_id` (FK), `entity_type` (`'board' | 'document' | 'snippet' | 'asset' | 'message'`), `entity_id` (UUID), `created_at`. PK `(tag_id, entity_type, entity_id)`.
- **`object_links`**: `source_type`, `source_id`, `target_type`, `target_id`, `created_at`.

---

## 5. Security Architecture

1. **Authentication & Identity**:
   - Supabase Auth manages cryptographically secure password storage and JWT provisioning.
   - Sessions are propagated via standard `HttpOnly`, `SameSite=Lax`, `Secure` cookies with `@supabase/ssr`.
2. **PostgreSQL Row Level Security (RLS)**:
   - Exposed tables have explicit `SELECT`, `INSERT`, `UPDATE`, `DELETE` policies.
   - Users can only query boards they own, are explicit members of, or access via valid share tokens.
   - Admin role override is enforced via PostgreSQL `SECURITY DEFINER` function `public.is_admin(auth.uid())`.
3. **Privileged Operations**:
   - Administrative tasks (user provisioning, password resets, account deactivation) use `SUPABASE_SERVICE_ROLE_KEY` in server route handlers ONLY. The service role key is strictly isolated from browser bundles.
4. **Cryptographic Share Links**:
   - High-entropy tokens generated using OS-level secure PRNG (`crypto.getRandomValues`).
   - Only SHA-256 hashes (`token_hash`) are stored in the database.

---

## 6. Real-Time Transport & Synchronization Protocol

### Whiteboard Synchronization
- **Transport**: Supabase Realtime Broadcast on channel `board:<boardId>`.
- **Echo Suppression**: Monotonic `clientId` injected into all outbound frames; inbound packets with matching `clientId` are discarded.
- **Throttled Broadcast**: Stroke broadcasts throttled to 40ms intervals to prevent network congestion while maintaining smooth visual feedback.
- **Autosave Pipeline**: 1000ms debounce timer triggers PostgreSQL JSONB writes. `visibilitychange` and `navigator.sendBeacon` ensure persistence on tab closure.

### Communication & Presence
- **Transport**: Supabase Realtime Broadcast & Postgres Changes on channel `chat:<channelId>`.
- **Presence**: Tracks active viewers, typers, and collaborator colors across boards and channels.

---

## 7. Operational Deployment Topology

```
                      INTERNET / CLIENTS
                              │
                              ▼
                      Vercel Edge Network
                   (Next.js App Router Host)
                              │
              ┌───────────────┴───────────────┐
              │                               │
              ▼                               ▼
       Supabase Services              GitHub Repository
     ├── Supabase Auth (JWT/Cookies)  (Version control & CI)
     ├── PostgreSQL 15 (RLS)
     ├── Realtime WebSocket Server
     └── S3-Compatible Object Storage
```

---

## 8. Definition of Done Checklist

- [x] **V1 Whiteboard Engine**: Excalidraw integration with dynamic client loading, full screen dimensions, and read-only viewer mode.
- [x] **V1 Persistence & Autosave**: Debounced JSONB persistence with live status badges.
- [x] **V1 Realtime Collaboration**: Broadcast channel synchronization with presence tracking.
- [x] **V1 Identity & Admin**: User creation, temporary credential setup, active status toggles, password reset.
- [x] **V1 Sharing & RLS**: Member permissions and SHA-256 hashed share links.
- [x] **V1.5 Communication Schema & Components**: Channels, DMs, Threads, Attachments.
- [x] **V2 Knowledge & Search**: Documents, First-Class Code Snippets, Universal Search & Tagging.
- [x] **Typecheck & Production Build**: Zero TypeScript errors (`npx tsc --noEmit`) and successful Next.js build (`npm run build`).
- [x] **GitHub Version Control**: Initialized git repository with clean commit history.
