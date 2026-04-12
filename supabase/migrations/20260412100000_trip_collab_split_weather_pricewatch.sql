ALTER TABLE public.trip_expenses
ADD COLUMN IF NOT EXISTS payer_name TEXT;

CREATE TABLE IF NOT EXISTS public.trip_collaborators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES public.saved_trips(id) ON DELETE CASCADE,
  user_id UUID NULL,
  display_name TEXT NOT NULL,
  email TEXT NULL,
  role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('owner', 'editor', 'viewer')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('invited', 'active')),
  invited_by UUID NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_trip_collaborators_trip_user
ON public.trip_collaborators(trip_id, user_id)
WHERE user_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_trip_collaborators_trip_email
ON public.trip_collaborators(trip_id, email)
WHERE email IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.trip_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES public.saved_trips(id) ON DELETE CASCADE,
  user_id UUID NULL,
  display_name TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.trip_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES public.saved_trips(id) ON DELETE CASCADE,
  subject_type TEXT NOT NULL CHECK (subject_type IN ('activity', 'expense')),
  subject_key TEXT NOT NULL,
  subject_label TEXT NOT NULL,
  voter_key TEXT NOT NULL,
  voter_name TEXT NOT NULL,
  user_id UUID NULL,
  vote_value INTEGER NOT NULL CHECK (vote_value IN (-1, 1)),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(trip_id, subject_type, subject_key, voter_key)
);

CREATE TABLE IF NOT EXISTS public.trip_expense_splits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id UUID NOT NULL REFERENCES public.trip_expenses(id) ON DELETE CASCADE,
  trip_id UUID NOT NULL REFERENCES public.saved_trips(id) ON DELETE CASCADE,
  member_name TEXT NOT NULL,
  member_email TEXT NULL,
  amount_owed NUMERIC NOT NULL CHECK (amount_owed >= 0),
  settled BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.trip_price_watches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES public.saved_trips(id) ON DELETE CASCADE,
  category TEXT NOT NULL DEFAULT 'transport' CHECK (category IN ('transport', 'stay', 'activity', 'food', 'other')),
  label TEXT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'INR',
  baseline_price NUMERIC NOT NULL CHECK (baseline_price >= 0),
  current_price NUMERIC NOT NULL CHECK (current_price >= 0),
  target_price NUMERIC NOT NULL CHECK (target_price >= 0),
  status TEXT NOT NULL DEFAULT 'watching' CHECK (status IN ('watching', 'alert', 'booked')),
  notes TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.trip_collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_expense_splits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_price_watches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view collaborators"
ON public.trip_collaborators
FOR SELECT
USING (true);

CREATE POLICY "Anyone can manage collaborators"
ON public.trip_collaborators
FOR ALL
USING (true)
WITH CHECK (true);

CREATE POLICY "Anyone can view trip messages"
ON public.trip_messages
FOR SELECT
USING (true);

CREATE POLICY "Anyone can manage trip messages"
ON public.trip_messages
FOR ALL
USING (true)
WITH CHECK (true);

CREATE POLICY "Anyone can view trip votes"
ON public.trip_votes
FOR SELECT
USING (true);

CREATE POLICY "Anyone can manage trip votes"
ON public.trip_votes
FOR ALL
USING (true)
WITH CHECK (true);

CREATE POLICY "Anyone can view trip expense splits"
ON public.trip_expense_splits
FOR SELECT
USING (true);

CREATE POLICY "Anyone can manage trip expense splits"
ON public.trip_expense_splits
FOR ALL
USING (true)
WITH CHECK (true);

CREATE POLICY "Anyone can view trip price watches"
ON public.trip_price_watches
FOR SELECT
USING (true);

CREATE POLICY "Anyone can manage trip price watches"
ON public.trip_price_watches
FOR ALL
USING (true)
WITH CHECK (true);
