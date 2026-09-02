# DrawSpace — Private Collaborative Whiteboard

DrawSpace is a private, lightweight collaborative workspace where small trusted groups can create Excalidraw whiteboards, save them permanently to PostgreSQL, collaborate live in real time, and control granular access permissions (Owner, Editor, Viewer, Share Links).

---

## 🚀 Core Features

- 🎨 **Full Excalidraw Engine**: Embedded official `@excalidraw/excalidraw` editor without forks or canvas compromises.
- ⚡ **Real-Time Collaboration**: Instant peer drawing synchronization using Supabase Realtime Broadcast with echo suppression.
- 👥 **Live Presence**: Online collaborator indicators showing active teammate avatars with unique color assignments.
- 💾 **Debounced Autosave**: Automatic background persistence (1000ms debounce) to PostgreSQL JSONB storage with status indicators ("Saved", "Saving...", "Offline").
- 🛡️ **PostgreSQL Row Level Security (RLS)**: Enforced database-level authorization for boards, members, and share links.
- 🔒 **Admin User Management**: Admin panel to create users, issue temporary credentials, reset passwords, toggle active/disabled states, and oversee workspace boards.
- 🔗 **Cryptographic Share Links**: Shareable links with SHA-256 token hashing, custom permission levels (View/Edit), and revocation support.
- 📱 **Clean Responsive UI**: Modern dashboard with "My Boards", "Shared with Me", search filtering, and mobile/tablet friendliness.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 (App Router) + TypeScript + Tailwind CSS |
| Drawing Engine | `@excalidraw/excalidraw` (React Component) |
| Authentication | Supabase Auth (HttpOnly SSR session cookies) |
| Database | Supabase PostgreSQL + Row Level Security (RLS) |
| Realtime Sync | Supabase Realtime Broadcast & Presence |
| Deployment | Vercel |

---

## 📦 Getting Started

### 1. Prerequisites
- Node.js 18+ (tested on Node 20 / 22 / 26)
- A Supabase project (Free tier or higher)

### 2. Configure Environment Variables
Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Fill in your Supabase credentials:

```ini
# Supabase Project URL and Public Anon Key
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# Supabase Service Role Key (kept strictly on server side for admin user management)
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
```

### 3. Run Database Migrations
Execute the SQL migration file in your **Supabase Dashboard → SQL Editor**:

1. Open [`supabase/migrations/001_initial_schema.sql`](./supabase/migrations/001_initial_schema.sql).
2. Copy and run the entire SQL script.
3. This creates:
   - `public.profiles` (auto-synced with `auth.users` via trigger)
   - `public.boards`
   - `public.board_members`
   - `public.share_links`
   - Helper functions (`is_admin`, `can_access_board`, `can_edit_board`)
   - Strict Row Level Security (RLS) policies on all tables.

### 4. First-Time Admin Account
The trigger in `001_initial_schema.sql` automatically designates the **very first user** created in your database as the `admin`.

You can create this account either:
- By running `npm run dev` and registering the first user, or
- Creating the first user via the Supabase Auth dashboard.

### 5. Install Dependencies & Run Locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📖 Product Acceptance Scenario (End-to-End V1 Verification)

1. **Admin Login**: Admin logs in at `/login`.
2. **User Creation**: Admin navigates to `/admin/users` and creates "Rahul" with an initial password.
3. **Member Login & Password Change**: Rahul logs in, goes to `/settings`, and changes his password.
4. **Board Creation**: Admin creates board "System Architecture" from the `/dashboard`.
5. **Drawing & Autosave**: Admin draws shapes on the board. The header displays `Saving…` then `Saved`.
6. **Member Sharing**: Admin clicks `Share` and adds Rahul as `Editor`.
7. **Realtime Multi-User Collaboration**:
   - Rahul opens the board in a separate window.
   - Admin and Rahul see each other's presence avatars live.
   - Rahul draws a node; Admin sees the update live without refreshing.
8. **Permissions Enforcement**: Admin changes Rahul's permission to `Viewer`. Rahul's canvas immediately becomes read-only (`View Only`).
9. **Share Link**: Admin creates a shareable link in `/share/<token>` mode and sends it to guest collaborators.

---

## 🚢 Production Deployment (Vercel)

1. Push code to your GitHub repository.
2. Import the repository in [Vercel](https://vercel.com).
3. Set the Environment Variables in Vercel project settings:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
4. Deploy!

---

## 🔒 Security Best Practices Implemented

- **No client-side role trust**: Admin privileges are derived server-side from PostgreSQL profiles and session data.
- **Service Role isolation**: `SUPABASE_SERVICE_ROLE_KEY` is only imported in Server API route handlers (`app/api/admin/*`), never in client components.
- **Hashed Share Tokens**: Raw share tokens are not stored plaintext in the database; only SHA-256 hashes (`token_hash`) are persisted.
- **PostgreSQL RLS**: Direct Supabase queries are bounded by database-level security policies.
