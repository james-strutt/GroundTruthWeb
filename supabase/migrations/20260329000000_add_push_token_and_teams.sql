-- Add push_token column to users table for push notifications
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS push_token text;

-- Create teams table
CREATE TABLE IF NOT EXISTS public.teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create team_members table
CREATE TABLE IF NOT EXISTS public.team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  invited_at timestamptz NOT NULL DEFAULT now(),
  accepted_at timestamptz,
  UNIQUE (team_id, user_id)
);

-- Add team_id to directories for team sharing
ALTER TABLE public.directories ADD COLUMN IF NOT EXISTS team_id uuid REFERENCES public.teams(id) ON DELETE SET NULL;

-- RLS policies for teams
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view teams they belong to"
  ON public.teams FOR SELECT
  USING (
    id IN (SELECT team_id FROM public.team_members WHERE user_id = auth.uid())
    OR owner_id = auth.uid()
  );

CREATE POLICY "Team owners can update their teams"
  ON public.teams FOR UPDATE
  USING (owner_id = auth.uid());

CREATE POLICY "Authenticated users can create teams"
  ON public.teams FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND owner_id = auth.uid());

CREATE POLICY "Team owners can delete their teams"
  ON public.teams FOR DELETE
  USING (owner_id = auth.uid());

CREATE POLICY "Users can view members of their teams"
  ON public.team_members FOR SELECT
  USING (
    team_id IN (SELECT id FROM public.teams WHERE owner_id = auth.uid())
    OR team_id IN (SELECT team_id FROM public.team_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Team owners and admins can manage members"
  ON public.team_members FOR INSERT
  WITH CHECK (
    team_id IN (
      SELECT id FROM public.teams WHERE owner_id = auth.uid()
      UNION
      SELECT team_id FROM public.team_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Team owners and admins can update members"
  ON public.team_members FOR UPDATE
  USING (
    team_id IN (
      SELECT id FROM public.teams WHERE owner_id = auth.uid()
      UNION
      SELECT team_id FROM public.team_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Team owners and admins can remove members"
  ON public.team_members FOR DELETE
  USING (
    team_id IN (
      SELECT id FROM public.teams WHERE owner_id = auth.uid()
      UNION
      SELECT team_id FROM public.team_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
    OR user_id = auth.uid()
  );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON public.team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON public.team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_directories_team_id ON public.directories(team_id);
CREATE INDEX IF NOT EXISTS idx_users_push_token ON public.users(push_token) WHERE push_token IS NOT NULL;
