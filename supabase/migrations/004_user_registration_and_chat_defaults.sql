-- 004_user_registration_and_chat_defaults.sql
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'approved';

UPDATE public.profiles SET username = LOWER(SPLIT_PART(email, '@', 1)) WHERE username IS NULL;

-- Update handle_new_user trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_role TEXT := 'user';
  v_status TEXT := 'approved';
  v_is_active BOOLEAN := true;
  v_username TEXT;
  v_name TEXT;
  user_count INT;
BEGIN
  SELECT COUNT(*) INTO user_count FROM public.profiles;
  
  -- First user is always approved admin
  IF user_count = 0 THEN
    v_role := 'admin';
    v_status := 'approved';
    v_is_active := true;
  ELSIF (NEW.raw_user_meta_data->>'role') = 'admin' THEN
    v_role := 'admin';
    v_status := 'approved';
    v_is_active := true;
  ELSIF (NEW.raw_user_meta_data->>'is_self_signup') = 'true' THEN
    -- Self-registered users start as pending approval
    v_role := 'user';
    v_status := 'pending';
    v_is_active := false;
  ELSE
    -- Admin-created users are approved immediately
    v_role := COALESCE(NEW.raw_user_meta_data->>'role', 'user');
    v_status := 'approved';
    v_is_active := true;
  END IF;

  v_username := LOWER(COALESCE(
    NEW.raw_user_meta_data->>'username',
    SPLIT_PART(NEW.email, '@', 1)
  ));

  v_name := COALESCE(
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'username',
    SPLIT_PART(NEW.email, '@', 1),
    'User'
  );

  INSERT INTO public.profiles (id, name, username, email, role, status, is_active, created_at, updated_at)
  VALUES (NEW.id, v_name, v_username, NEW.email, v_role, v_status, v_is_active, now(), now())
  ON CONFLICT (id) DO UPDATE
  SET
    email = EXCLUDED.email,
    name = COALESCE(EXCLUDED.name, public.profiles.name),
    username = COALESCE(EXCLUDED.username, public.profiles.username),
    updated_at = now();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure default channels exist
INSERT INTO public.channels (id, name, description, is_private, created_by)
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'general', 'General team discussions and whiteboard ideas', false, 'd1e6fbf0-4423-4b32-93aa-5cd87d005de8'),
  ('00000000-0000-0000-0000-000000000002', 'whiteboards', 'Share live canvas links and brainstorm', false, 'd1e6fbf0-4423-4b32-93aa-5cd87d005de8'),
  ('00000000-0000-0000-0000-000000000003', 'code-snippets', 'Code snippets, algorithms, and technical specs', false, 'd1e6fbf0-4423-4b32-93aa-5cd87d005de8')
ON CONFLICT (name) DO NOTHING;
