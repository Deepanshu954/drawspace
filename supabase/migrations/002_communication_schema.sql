-- DrawSpace Phase 1.5 Communication Migration
-- Channels, Direct Messages, Message Threads, Reactions, and Attachments

-- 1. Channels table
CREATE TABLE IF NOT EXISTS public.channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  is_private BOOLEAN NOT NULL DEFAULT false,
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Channel members table
CREATE TABLE IF NOT EXISTS public.channel_members (
  channel_id UUID NOT NULL REFERENCES public.channels(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'member')) DEFAULT 'member',
  last_read_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (channel_id, user_id)
);

-- 3. Direct Message conversations
CREATE TABLE IF NOT EXISTS public.direct_message_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user1_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  user2_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_dm_pair UNIQUE(user1_id, user2_id)
);

-- 4. Messages table (supports channels, DMs, threads, and rich object references)
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID REFERENCES public.channels(id) ON DELETE CASCADE,
  dm_id UUID REFERENCES public.direct_message_conversations(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.messages(id) ON DELETE CASCADE, -- Thread parent
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  message_type TEXT NOT NULL CHECK (message_type IN ('text', 'code', 'object_ref', 'system')) DEFAULT 'text',
  metadata JSONB DEFAULT '{}'::jsonb, -- For referenced boards, docs, snippets
  is_edited BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT channel_or_dm CHECK (
    (channel_id IS NOT NULL AND dm_id IS NULL) OR
    (channel_id IS NULL AND dm_id IS NOT NULL)
  )
);

-- 5. Message Attachments table
CREATE TABLE IF NOT EXISTS public.message_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Message Reactions table
CREATE TABLE IF NOT EXISTS public.message_reactions (
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (message_id, user_id, emoji)
);

-- Indexes for lightning fast queries
CREATE INDEX IF NOT EXISTS idx_messages_channel_id ON public.messages(channel_id);
CREATE INDEX IF NOT EXISTS idx_messages_dm_id ON public.messages(dm_id);
CREATE INDEX IF NOT EXISTS idx_messages_parent_id ON public.messages(parent_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at);
CREATE INDEX IF NOT EXISTS idx_channel_members_user_id ON public.channel_members(user_id);

-- Enable RLS
ALTER TABLE public.channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channel_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.direct_message_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------
-- RLS Policies for Communication
-- ----------------------------------------------------
-- Channels: Public channels viewable by all authenticated users; Private channels by members only
CREATE POLICY "Public channels viewable by authenticated users"
  ON public.channels FOR SELECT
  TO authenticated
  USING (
    NOT is_private OR
    public.is_admin(auth.uid()) OR
    EXISTS (SELECT 1 FROM public.channel_members WHERE channel_id = id AND user_id = auth.uid())
  );

CREATE POLICY "Users can create channels"
  ON public.channels FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

-- Messages: Viewable by channel members or DM participants
CREATE POLICY "Messages viewable by channel or DM participants"
  ON public.messages FOR SELECT
  TO authenticated
  USING (
    public.is_admin(auth.uid()) OR
    (channel_id IS NOT NULL AND (
      NOT EXISTS (SELECT 1 FROM public.channels WHERE id = channel_id AND is_private = true) OR
      EXISTS (SELECT 1 FROM public.channel_members WHERE channel_id = messages.channel_id AND user_id = auth.uid())
    )) OR
    (dm_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.direct_message_conversations
      WHERE id = messages.dm_id AND (user1_id = auth.uid() OR user2_id = auth.uid())
    ))
  );

CREATE POLICY "Authenticated users can insert messages"
  ON public.messages FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Senders can update own messages"
  ON public.messages FOR UPDATE
  TO authenticated
  USING (auth.uid() = sender_id);

CREATE POLICY "Senders and admins can delete messages"
  ON public.messages FOR DELETE
  TO authenticated
  USING (auth.uid() = sender_id OR public.is_admin(auth.uid()));

-- Attachments & Reactions
CREATE POLICY "Attachments viewable by message readers"
  ON public.message_attachments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Reactions viewable by all"
  ON public.message_reactions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can add reactions"
  ON public.message_reactions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove own reactions"
  ON public.message_reactions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Insert default starter channels if not exist
INSERT INTO public.channels (id, name, description, is_private, created_by)
SELECT '00000000-0000-0000-0000-000000000001', 'general', 'General team discussions and whiteboard links', false, id
FROM public.profiles LIMIT 1
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.channels (id, name, description, is_private, created_by)
SELECT '00000000-0000-0000-0000-000000000002', 'coding', 'Code discussions, snippets, and review', false, id
FROM public.profiles LIMIT 1
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.channels (id, name, description, is_private, created_by)
SELECT '00000000-0000-0000-0000-000000000003', 'dsa-problems', 'Algorithms, data structures, and graph revision', false, id
FROM public.profiles LIMIT 1
ON CONFLICT (name) DO NOTHING;
