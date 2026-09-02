-- DrawSpace Phase 2 Knowledge Layer Migration
-- Documents, First-Class Code Snippets, Named Assets, Tags, Entity Tags, and Object Relationships

-- 1. Documents table (Lightweight markdown knowledge base)
CREATE TABLE IF NOT EXISTS public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  is_public BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Code Snippets table (First-class snippets with syntax highlighting)
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

-- 3. Assets table (Named screenshots, diagrams, PDFs, and uploaded files)
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

-- 4. Universal Tags table
CREATE TABLE IF NOT EXISTS public.tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  color TEXT NOT NULL DEFAULT '#6366F1',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Entity Tags junction table (attaches tags across all objects)
CREATE TABLE IF NOT EXISTS public.entity_tags (
  tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('board', 'document', 'snippet', 'asset', 'message')),
  entity_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (tag_id, entity_type, entity_id)
);

-- 6. Object Links table (Cross-links between boards, docs, snippets, and chat)
CREATE TABLE IF NOT EXISTS public.object_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_type TEXT NOT NULL,
  source_id UUID NOT NULL,
  target_type TEXT NOT NULL,
  target_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_documents_owner_id ON public.documents(owner_id);
CREATE INDEX IF NOT EXISTS idx_code_snippets_owner_id ON public.code_snippets(owner_id);
CREATE INDEX IF NOT EXISTS idx_assets_owner_id ON public.assets(owner_id);
CREATE INDEX IF NOT EXISTS idx_entity_tags_entity ON public.entity_tags(entity_type, entity_id);

-- Enable RLS
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.code_snippets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entity_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.object_links ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------
-- RLS Policies
-- ----------------------------------------------------
-- Documents
CREATE POLICY "Documents viewable by authenticated users"
  ON public.documents FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create documents"
  ON public.documents FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners and admins can update documents"
  ON public.documents FOR UPDATE
  TO authenticated
  USING (auth.uid() = owner_id OR public.is_admin(auth.uid()));

CREATE POLICY "Owners and admins can delete documents"
  ON public.documents FOR DELETE
  TO authenticated
  USING (auth.uid() = owner_id OR public.is_admin(auth.uid()));

-- Code Snippets
CREATE POLICY "Snippets viewable by authenticated users"
  ON public.code_snippets FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create snippets"
  ON public.code_snippets FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners and admins can update snippets"
  ON public.code_snippets FOR UPDATE
  TO authenticated
  USING (auth.uid() = owner_id OR public.is_admin(auth.uid()));

CREATE POLICY "Owners and admins can delete snippets"
  ON public.code_snippets FOR DELETE
  TO authenticated
  USING (auth.uid() = owner_id OR public.is_admin(auth.uid()));

-- Assets & Tags
CREATE POLICY "Assets viewable by authenticated users"
  ON public.assets FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create assets"
  ON public.assets FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Tags viewable by all authenticated users"
  ON public.tags FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create tags"
  ON public.tags FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Entity tags viewable by all"
  ON public.entity_tags FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can assign entity tags"
  ON public.entity_tags FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Insert starter tags
INSERT INTO public.tags (name, color)
VALUES
  ('dsa', '#EF4444'),
  ('system-design', '#3B82F6'),
  ('backend', '#10B981'),
  ('frontend', '#F59E0B'),
  ('architecture', '#8B5CF6'),
  ('important', '#EC4899')
ON CONFLICT (name) DO NOTHING;
