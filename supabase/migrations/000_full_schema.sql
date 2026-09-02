-- ============================================================================
-- DRAWSPACE MASTER SCHEMA MIGRATION (V1 + V1.5 + V2)
-- Copy and run this complete file in Supabase SQL Editor
-- ============================================================================

-- ----------------------------------------------------
-- 1. PROFILES & USERS (V1 Core)
-- ----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'user')) DEFAULT 'user',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------
-- 2. BOARDS & PERMISSIONS (V1 Core)
-- ----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.boards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  scene_data JSONB NOT NULL DEFAULT '{"elements": [], "appState": {}, "files": {}}'::jsonb,
  thumbnail_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.board_members (
  board_id UUID NOT NULL REFERENCES public.boards(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  permission TEXT NOT NULL CHECK (permission IN ('viewer', 'editor')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (board_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.share_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id UUID NOT NULL REFERENCES public.boards(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  permission TEXT NOT NULL CHECK (permission IN ('viewer', 'editor')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  expires_at TIMESTAMPTZ NULL,
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------
-- 3. CHAT & COMMUNICATION (V1.5 Communication)
-- ----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  is_private BOOLEAN NOT NULL DEFAULT false,
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.channel_members (
  channel_id UUID NOT NULL REFERENCES public.channels(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'member')) DEFAULT 'member',
  last_read_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (channel_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.direct_message_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user1_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  user2_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_dm_pair UNIQUE(user1_id, user2_id)
);

CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID REFERENCES public.channels(id) ON DELETE CASCADE,
  dm_id UUID REFERENCES public.direct_message_conversations(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.messages(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  message_type TEXT NOT NULL CHECK (message_type IN ('text', 'code', 'object_ref', 'system')) DEFAULT 'text',
  metadata JSONB DEFAULT '{}'::jsonb,
  is_edited BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.message_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.message_reactions (
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (message_id, user_id, emoji)
);

-- ----------------------------------------------------
-- 4. KNOWLEDGE BASE, SNIPPETS & TAGS (V2 Knowledge)
-- ----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  is_public BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.code_snippets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'typescript',
  code TEXT NOT NULL,
  description TEXT,
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  color TEXT NOT NULL DEFAULT '#6366F1',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.entity_tags (
  tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('board', 'document', 'snippet', 'asset', 'message')),
  entity_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (tag_id, entity_type, entity_id)
);

CREATE TABLE IF NOT EXISTS public.object_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_type TEXT NOT NULL,
  source_id UUID NOT NULL,
  target_type TEXT NOT NULL,
  target_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------
-- 5. INDEXES & RLS POLICIES
-- ----------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_boards_owner_id ON public.boards(owner_id);
CREATE INDEX IF NOT EXISTS idx_board_members_user ON public.board_members(user_id);
CREATE INDEX IF NOT EXISTS idx_board_members_board ON public.board_members(board_id);
CREATE INDEX IF NOT EXISTS idx_share_links_hash ON public.share_links(token_hash);
CREATE INDEX IF NOT EXISTS idx_messages_channel ON public.messages(channel_id);
CREATE INDEX IF NOT EXISTS idx_messages_dm ON public.messages(dm_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON public.messages(created_at);
CREATE INDEX IF NOT EXISTS idx_documents_owner ON public.documents(owner_id);
CREATE INDEX IF NOT EXISTS idx_snippets_owner ON public.code_snippets(owner_id);
CREATE INDEX IF NOT EXISTS idx_entity_tags ON public.entity_tags(entity_type, entity_id);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.board_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.share_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channel_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.direct_message_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.code_snippets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entity_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.object_links ENABLE ROW LEVEL SECURITY;

-- Helper Functions
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = user_id AND role = 'admin' AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.can_access_board(p_board_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  IF public.is_admin(p_user_id) THEN
    RETURN true;
  END IF;
  RETURN EXISTS (
    SELECT 1 FROM public.boards WHERE id = p_board_id AND owner_id = p_user_id
  ) OR EXISTS (
    SELECT 1 FROM public.board_members WHERE board_id = p_board_id AND user_id = p_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.can_edit_board(p_board_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  IF public.is_admin(p_user_id) THEN
    RETURN true;
  END IF;
  IF EXISTS (SELECT 1 FROM public.boards WHERE id = p_board_id AND owner_id = p_user_id) THEN
    RETURN true;
  END IF;
  RETURN EXISTS (
    SELECT 1 FROM public.board_members
    WHERE board_id = p_board_id AND user_id = p_user_id AND permission = 'editor'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Profiles Policies
CREATE POLICY "Profiles viewable by authenticated" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Admins update all profiles" ON public.profiles FOR UPDATE TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins delete profiles" ON public.profiles FOR DELETE TO authenticated USING (public.is_admin(auth.uid()));

-- Boards Policies
CREATE POLICY "Users view authorized boards" ON public.boards FOR SELECT TO authenticated USING (public.can_access_board(id, auth.uid()));
CREATE POLICY "Users insert boards" ON public.boards FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Editors update boards" ON public.boards FOR UPDATE TO authenticated USING (public.can_edit_board(id, auth.uid()));
CREATE POLICY "Owners and admins delete boards" ON public.boards FOR DELETE TO authenticated USING (owner_id = auth.uid() OR public.is_admin(auth.uid()));

-- Board Members Policies
CREATE POLICY "View board members" ON public.board_members FOR SELECT TO authenticated USING (public.can_access_board(board_id, auth.uid()));
CREATE POLICY "Manage board members" ON public.board_members FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.boards WHERE id = board_id AND owner_id = auth.uid()) OR public.is_admin(auth.uid())
);

-- Share Links Policies
CREATE POLICY "View share links" ON public.share_links FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.boards WHERE id = board_id AND owner_id = auth.uid()) OR public.is_admin(auth.uid())
);
CREATE POLICY "Manage share links" ON public.share_links FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.boards WHERE id = board_id AND owner_id = auth.uid()) OR public.is_admin(auth.uid())
);

-- Communication Policies
CREATE POLICY "View channels" ON public.channels FOR SELECT TO authenticated USING (
  NOT is_private OR public.is_admin(auth.uid()) OR EXISTS (SELECT 1 FROM public.channel_members WHERE channel_id = id AND user_id = auth.uid())
);
CREATE POLICY "Insert channels" ON public.channels FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "View messages" ON public.messages FOR SELECT TO authenticated USING (true);
CREATE POLICY "Insert messages" ON public.messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Update messages" ON public.messages FOR UPDATE TO authenticated USING (auth.uid() = sender_id);
CREATE POLICY "Delete messages" ON public.messages FOR DELETE TO authenticated USING (auth.uid() = sender_id OR public.is_admin(auth.uid()));
CREATE POLICY "View message attachments" ON public.message_attachments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Insert message attachments" ON public.message_attachments FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "View reactions" ON public.message_reactions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Manage reactions" ON public.message_reactions FOR ALL TO authenticated USING (auth.uid() = user_id);

-- Knowledge Policies
CREATE POLICY "View docs" ON public.documents FOR SELECT TO authenticated USING (true);
CREATE POLICY "Manage docs" ON public.documents FOR ALL TO authenticated USING (owner_id = auth.uid() OR public.is_admin(auth.uid()));
CREATE POLICY "View snippets" ON public.code_snippets FOR SELECT TO authenticated USING (true);
CREATE POLICY "Manage snippets" ON public.code_snippets FOR ALL TO authenticated USING (owner_id = auth.uid() OR public.is_admin(auth.uid()));
CREATE POLICY "View assets" ON public.assets FOR SELECT TO authenticated USING (true);
CREATE POLICY "Manage assets" ON public.assets FOR ALL TO authenticated USING (owner_id = auth.uid() OR public.is_admin(auth.uid()));
CREATE POLICY "View tags" ON public.tags FOR SELECT TO authenticated USING (true);
CREATE POLICY "Insert tags" ON public.tags FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "View entity tags" ON public.entity_tags FOR SELECT TO authenticated USING (true);
CREATE POLICY "Insert entity tags" ON public.entity_tags FOR INSERT TO authenticated WITH CHECK (true);

-- ----------------------------------------------------
-- 6. USER REGISTRATION TRIGGER
-- ----------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_role TEXT := 'user';
  v_name TEXT;
  user_count INT;
BEGIN
  SELECT COUNT(*) INTO user_count FROM public.profiles;
  IF user_count = 0 THEN
    v_role := 'admin';
  ELSIF (NEW.raw_user_meta_data->>'role') IS NOT NULL AND (NEW.raw_user_meta_data->>'role') IN ('admin', 'user') THEN
    v_role := NEW.raw_user_meta_data->>'role';
  END IF;

  v_name := COALESCE(
    NEW.raw_user_meta_data->>'name',
    SPLIT_PART(NEW.email, '@', 1),
    'User'
  );

  INSERT INTO public.profiles (id, name, email, role, is_active, created_at, updated_at)
  VALUES (NEW.id, v_name, NEW.email, v_role, true, now(), now())
  ON CONFLICT (id) DO UPDATE
  SET
    email = EXCLUDED.email,
    name = COALESCE(EXCLUDED.name, public.profiles.name),
    updated_at = now();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
