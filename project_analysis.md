# DrawSpace: Architecture Analysis & Open-Source Roadmap

## 1. Current State Assessment
**The Good:**
* **Stack:** Next.js (App Router) + Tailwind CSS is the perfect modern frontend stack.
* **Backend:** Supabase provides an excellent unified backend (Auth, Postgres, Storage).
* **Canvas:** Excalidraw is the best-in-class open-source whiteboard.
* **UI/UX:** Dark mode, Ray.so snippets, and clean routing provide a highly polished feel.

**The Bottlenecks (Why we need open-source upgrades):**
* **Custom Chat:** Building a production-ready chat (with typing indicators, read receipts, offline caching, thread resolution, and unread badges) using basic DB tables and Supabase broadcasts is extremely difficult to scale and prone to race conditions.
* **Basic Documents:** A standard markdown/text editor cannot compete with modern tools. Users expect a Notion-like block-editing experience.
* **Multiplayer Conflicts:** Currently, board collaboration relies on basic event broadcasting. If two users edit the exact same object simultaneously on a slow connection, it can cause sync conflicts or overwrite data.
* **Lack of Global Search:** Searching across boards, chats, and docs using SQL `ILIKE` queries will become slow and inaccurate (no typo tolerance).

---

## 2. Recommended Open-Source & Free Integrations

To make DrawSpace a true enterprise-grade tool with minimal custom code, I recommend integrating the following open-source/free projects:

### 💬 A. Messaging & Chat
Instead of managing custom tables for every message state, we should use a dedicated chat infrastructure.
* **Recommendation 1 (Open-Source UI + CRDTs): [Chatscope](https://chatscope.io/) + [Yjs](https://yjs.dev/)**
  * Use Chatscope's beautiful React components (so we don't have to build message bubbles, avatars, input bars, and scrolling logic).
  * Use **Yjs** (a CRDT - Conflict-free Replicated Data Type) syncing over Supabase Realtime to make the chat *Offline-First* and instantly responsive.
* **Recommendation 2 (Hosted Free Tier): [Stream Chat (Maker Account)](https://getstream.io/maker/)**
  * Not open source, but heavily used by devs. Their Maker tier is **100% free** for small/medium apps and gives you a complete Slack-clone UI out of the box (threads, reactions, typing indicators, rich media, Giphy integration) in minutes.
* **Recommendation 3 (Open Standard): [Matrix.org](https://matrix.org/)**
  * The ultimate open-source decentralized chat standard. We could embed a lightweight Matrix client (like Hydrogen) to handle all messaging.

### 📝 B. Knowledge Base (Docs)
Users want Notion, not just a text box.
* **Recommendation: [Novel.sh](https://novel.sh/) or [TipTap](https://tiptap.dev/)**
  * Novel is an open-source Notion-style WYSIWYG editor built on TipTap. 
  * It gives us slash commands (`/`), block-based editing, drag-and-drop images, and even AI autocomplete (if you add an API key) completely for free. 
  * TipTap natively supports **Yjs**, meaning multiple people can type in the same document at the same time and see each other's cursors (Google Docs style).

### 🤝 C. Flawless Multiplayer Sync (Canvas & State)
* **Recommendation: [Yjs](https://yjs.dev/) or [Liveblocks (Free Tier)](https://liveblocks.io/)**
  * Excalidraw officially supports **Yjs**. By switching our Supabase broadcast to a Yjs provider (like `y-webrtc` or `y-supabase`), we get mathematically guaranteed conflict resolution.
  * Alternatively, **Liveblocks** offers a generous free tier specifically built for Next.js real-time apps. It provides real-time cursors, presence (who is online), and data sync with a few hooks (`useOthers`, `useUpdateMyPresence`).

### 🎙️ D. Voice & Video Huddles (New Feature!)
To truly compete with Slack/Discord, DrawSpace needs voice channels.
* **Recommendation: [LiveKit](https://livekit.io/)**
  * The best open-source WebRTC infrastructure. They provide ready-to-use Next.js React components (`<LiveKitRoom>`). 
  * You can spin up a free LiveKit Cloud project, and instantly users can hop into audio/video "Huddles" within your chat channels.

### 🔍 E. Global Search
* **Recommendation: [Meilisearch](https://www.meilisearch.com/)**
  * Open-source, insanely fast, typo-tolerant search engine. We can index snippets, chat history, and board names into Meilisearch to give users a `Cmd+K` global search bar that returns results in 50 milliseconds.

---

## 3. The Implementation Roadmap

If you agree with this direction, here is how we should stage the upgrades without breaking the live app:

**Phase 1: The Notion Upgrade (High Impact, Low Effort)**
* Replace the current `/documents` editor with **Novel.sh / TipTap**. 
* Add Yjs + Supabase Provider so users get real-time collaborative Notion-like docs.

**Phase 2: The Multiplayer Upgrade**
* Wire Excalidraw up to **Yjs** to ensure perfect, conflict-free syncing of drawings, even if users go offline and reconnect.

**Phase 3: The Chat Overhaul**
* Decide on the chat direction (e.g., Stream Chat for speed, or Chatscope+Yjs for open-source purity).
* Migrate the custom chat UI to the new framework to instantly gain threads, reactions, read receipts, and typing indicators.

**Phase 4: Huddles (Bonus)**
* Drop in LiveKit to allow users to click a "Join Audio" button in any channel.
