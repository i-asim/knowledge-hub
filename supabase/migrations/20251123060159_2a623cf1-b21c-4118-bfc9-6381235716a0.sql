-- Create profiles table for user information
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Profiles are viewable by everyone" 
  ON public.profiles FOR SELECT 
  USING (true);

CREATE POLICY "Users can update their own profile" 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" 
  ON public.profiles FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- Create workspaces table
CREATE TABLE public.workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;

-- Workspace member roles enum
CREATE TYPE public.member_role AS ENUM ('owner', 'admin', 'editor', 'viewer');

-- Create workspace_members table
CREATE TABLE public.workspace_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role public.member_role NOT NULL DEFAULT 'editor',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(workspace_id, user_id)
);

ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;

-- Create documents table
CREATE TABLE public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Untitled Document',
  content TEXT DEFAULT '',
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Workspace policies - users can view workspaces they're members of
CREATE POLICY "Users can view their workspaces" 
  ON public.workspaces FOR SELECT 
  USING (
    owner_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM public.workspace_members 
      WHERE workspace_id = workspaces.id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create workspaces" 
  ON public.workspaces FOR INSERT 
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners and admins can update workspaces" 
  ON public.workspaces FOR UPDATE 
  USING (
    owner_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM public.workspace_members 
      WHERE workspace_id = workspaces.id 
      AND user_id = auth.uid() 
      AND role IN ('admin')
    )
  );

CREATE POLICY "Owners can delete workspaces" 
  ON public.workspaces FOR DELETE 
  USING (owner_id = auth.uid());

-- Workspace members policies
CREATE POLICY "Users can view workspace members" 
  ON public.workspace_members FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.workspaces 
      WHERE id = workspace_id 
      AND (owner_id = auth.uid() OR 
        EXISTS (
          SELECT 1 FROM public.workspace_members wm 
          WHERE wm.workspace_id = workspace_id AND wm.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Owners and admins can manage members" 
  ON public.workspace_members FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.workspaces 
      WHERE id = workspace_id 
      AND (owner_id = auth.uid() OR 
        EXISTS (
          SELECT 1 FROM public.workspace_members wm 
          WHERE wm.workspace_id = workspace_id 
          AND wm.user_id = auth.uid() 
          AND wm.role IN ('admin')
        )
      )
    )
  );

-- Documents policies - users can view documents in workspaces they're members of
CREATE POLICY "Users can view workspace documents" 
  ON public.documents FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.workspaces w
      LEFT JOIN public.workspace_members wm ON w.id = wm.workspace_id
      WHERE w.id = workspace_id 
      AND (w.owner_id = auth.uid() OR wm.user_id = auth.uid())
    )
  );

CREATE POLICY "Editors and above can create documents" 
  ON public.documents FOR INSERT 
  WITH CHECK (
    auth.uid() = created_by AND
    EXISTS (
      SELECT 1 FROM public.workspaces w
      LEFT JOIN public.workspace_members wm ON w.id = wm.workspace_id
      WHERE w.id = workspace_id 
      AND (
        w.owner_id = auth.uid() OR 
        (wm.user_id = auth.uid() AND wm.role IN ('editor', 'admin'))
      )
    )
  );

CREATE POLICY "Editors and above can update documents" 
  ON public.documents FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.workspaces w
      LEFT JOIN public.workspace_members wm ON w.id = wm.workspace_id
      WHERE w.id = workspace_id 
      AND (
        w.owner_id = auth.uid() OR 
        (wm.user_id = auth.uid() AND wm.role IN ('editor', 'admin'))
      )
    )
  );

CREATE POLICY "Owners and admins can delete documents" 
  ON public.documents FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM public.workspaces w
      LEFT JOIN public.workspace_members wm ON w.id = wm.workspace_id
      WHERE w.id = workspace_id 
      AND (w.owner_id = auth.uid() OR (wm.user_id = auth.uid() AND wm.role = 'admin'))
    )
  );

-- Function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id, 
    NEW.email,
    NEW.raw_user_meta_data->>'full_name'
  );
  RETURN NEW;
END;
$$;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_workspaces_updated_at
  BEFORE UPDATE ON public.workspaces
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_documents_updated_at
  BEFORE UPDATE ON public.documents
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();