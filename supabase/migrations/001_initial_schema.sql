-- DrawSpace Database Initial Schema Migration
-- Enables Row Level Security (RLS) on all exposed tables

-- 1. Create profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'user')) DEFAULT 'user',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Create boards table
CREATE TABLE IF NOT EXISTS public.boards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  scene_data JSONB NOT NULL DEFAULT '{"elements": [], "appState": {}, "files": {}}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Create board_members table (collaboration permissions)
CREATE TABLE IF NOT EXISTS public.board_members (
  board_id UUID NOT NULL REFERENCES public.boards(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  permission TEXT NOT NULL CHECK (permission IN ('viewer', 'editor')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (board_id, user_id)
);

-- 4. Create share_links table
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

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_boards_owner_id ON public.boards(owner_id);
CREATE INDEX IF NOT EXISTS idx_board_members_user_id ON public.board_members(user_id);
CREATE INDEX IF NOT EXISTS idx_board_members_board_id ON public.board_members(board_id);
CREATE INDEX IF NOT EXISTS idx_share_links_token_hash ON public.share_links(token_hash);
CREATE INDEX IF NOT EXISTS idx_share_links_board_id ON public.share_links(board_id);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.board_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.share_links ENABLE ROW LEVEL SECURITY;

-- Helper functions for RLS checks (SECURITY DEFINER to avoid recursion)
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
  -- Admin override
  IF public.is_admin(p_user_id) THEN
    RETURN true;
  END IF;

  -- Board owner or active member
  RETURN EXISTS (
    SELECT 1 FROM public.boards
    WHERE id = p_board_id AND owner_id = p_user_id
  ) OR EXISTS (
    SELECT 1 FROM public.board_members
    WHERE board_id = p_board_id AND user_id = p_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.can_edit_board(p_board_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Admin override
  IF public.is_admin(p_user_id) THEN
    RETURN true;
  END IF;

  -- Board owner
  IF EXISTS (SELECT 1 FROM public.boards WHERE id = p_board_id AND owner_id = p_user_id) THEN
    RETURN true;
  END IF;

  -- Member with editor permission
  RETURN EXISTS (
    SELECT 1 FROM public.board_members
    WHERE board_id = p_board_id AND user_id = p_user_id AND permission = 'editor'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ----------------------------------------------------
-- RLS Policies: profiles
-- ----------------------------------------------------
-- Active users can view profiles (needed for dashboard member search / presence display)
CREATE POLICY "Profiles are viewable by authenticated users"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

-- Users can update their own profile name
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Admins can update all profiles
CREATE POLICY "Admins can update all profiles"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- Admins can delete profiles
CREATE POLICY "Admins can delete profiles"
  ON public.profiles FOR DELETE
  TO authenticated
  USING (public.is_admin(auth.uid()));

-- ----------------------------------------------------
-- RLS Policies: boards
-- ----------------------------------------------------
-- Users can view boards they own, are members of, or if they are admin
CREATE POLICY "Users can view authorized boards"
  ON public.boards FOR SELECT
  TO authenticated
  USING (public.can_access_board(id, auth.uid()));

-- Users can insert their own boards
CREATE POLICY "Users can create boards"
  ON public.boards FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = owner_id AND
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_active = true)
  );

-- Users can update boards if they are owner, editor member, or admin
CREATE POLICY "Editors and owners can update boards"
  ON public.boards FOR UPDATE
  TO authenticated
  USING (public.can_edit_board(id, auth.uid()))
  WITH CHECK (public.can_edit_board(id, auth.uid()));

-- Only owners or admins can delete boards
CREATE POLICY "Owners and admins can delete boards"
  ON public.boards FOR DELETE
  TO authenticated
  USING (
    owner_id = auth.uid() OR
    public.is_admin(auth.uid())
  );

-- ----------------------------------------------------
-- RLS Policies: board_members
-- ----------------------------------------------------
-- Members can view other members of boards they have access to
CREATE POLICY "Board members viewable by authorized users"
  ON public.board_members FOR SELECT
  TO authenticated
  USING (public.can_access_board(board_id, auth.uid()));

-- Only board owners or admins can manage members
CREATE POLICY "Owners and admins can add board members"
  ON public.board_members FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.boards WHERE id = board_id AND owner_id = auth.uid()) OR
    public.is_admin(auth.uid())
  );

CREATE POLICY "Owners and admins can update board members"
  ON public.board_members FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.boards WHERE id = board_id AND owner_id = auth.uid()) OR
    public.is_admin(auth.uid())
  );

CREATE POLICY "Owners and admins can remove board members"
  ON public.board_members FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.boards WHERE id = board_id AND owner_id = auth.uid()) OR
    public.is_admin(auth.uid())
  );

-- ----------------------------------------------------
-- RLS Policies: share_links
-- ----------------------------------------------------
-- Board owners and admins can view and manage share links
CREATE POLICY "Owners and admins can view share links"
  ON public.share_links FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.boards WHERE id = board_id AND owner_id = auth.uid()) OR
    public.is_admin(auth.uid())
  );

CREATE POLICY "Owners and admins can create share links"
  ON public.share_links FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.boards WHERE id = board_id AND owner_id = auth.uid()) OR
    public.is_admin(auth.uid())
  );

CREATE POLICY "Owners and admins can update share links"
  ON public.share_links FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.boards WHERE id = board_id AND owner_id = auth.uid()) OR
    public.is_admin(auth.uid())
  );

CREATE POLICY "Owners and admins can delete share links"
  ON public.share_links FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.boards WHERE id = board_id AND owner_id = auth.uid()) OR
    public.is_admin(auth.uid())
  );

-- ----------------------------------------------------
-- Trigger: Handle new user registration into profiles
-- ----------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_role TEXT := 'user';
  v_name TEXT;
  user_count INT;
BEGIN
  -- If this is the very first user created in the system, automatically make them admin
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

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
