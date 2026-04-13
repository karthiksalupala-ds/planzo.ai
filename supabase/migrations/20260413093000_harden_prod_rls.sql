-- Production hardening: tighten public policies and require authenticated membership checks.

-- Helper: trip owner check
CREATE OR REPLACE FUNCTION public.is_trip_owner(target_trip_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.saved_trips st
    WHERE st.id = target_trip_id
      AND st.user_id = auth.uid()
  );
$$;

-- Helper: trip member check (owner or active collaborator)
CREATE OR REPLACE FUNCTION public.can_view_trip(target_trip_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT (
    public.is_trip_owner(target_trip_id)
    OR EXISTS (
      SELECT 1
      FROM public.trip_collaborators tc
      WHERE tc.trip_id = target_trip_id
        AND tc.user_id = auth.uid()
        AND tc.status = 'active'
    )
  );
$$;

-- Helper: trip editor check (owner or active editor/owner collaborator)
CREATE OR REPLACE FUNCTION public.can_edit_trip(target_trip_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT (
    public.is_trip_owner(target_trip_id)
    OR EXISTS (
      SELECT 1
      FROM public.trip_collaborators tc
      WHERE tc.trip_id = target_trip_id
        AND tc.user_id = auth.uid()
        AND tc.status = 'active'
        AND tc.role IN ('owner', 'editor')
    )
  );
$$;

-- saved_trips: remove globally public read and restore membership-based read.
DROP POLICY IF EXISTS "Anyone can view trips" ON public.saved_trips;
DROP POLICY IF EXISTS "Users can view own trips" ON public.saved_trips;

CREATE POLICY "Trip members can view trips"
ON public.saved_trips
FOR SELECT
USING (public.can_view_trip(id));

-- trip_cache: service role only
DROP POLICY IF EXISTS "Anyone can read trip cache" ON public.trip_cache;
DROP POLICY IF EXISTS "System can insert into cache" ON public.trip_cache;

CREATE POLICY "Service role can read trip cache"
ON public.trip_cache
FOR SELECT
USING (auth.role() = 'service_role');

CREATE POLICY "Service role can insert trip cache"
ON public.trip_cache
FOR INSERT
WITH CHECK (auth.role() = 'service_role');

-- collaborators
DROP POLICY IF EXISTS "Anyone can view collaborators" ON public.trip_collaborators;
DROP POLICY IF EXISTS "Anyone can manage collaborators" ON public.trip_collaborators;

CREATE POLICY "Trip members can view collaborators"
ON public.trip_collaborators
FOR SELECT
USING (public.can_view_trip(trip_id));

CREATE POLICY "Trip editors can insert collaborators"
ON public.trip_collaborators
FOR INSERT
WITH CHECK (public.can_edit_trip(trip_id));

CREATE POLICY "Trip editors can update collaborators"
ON public.trip_collaborators
FOR UPDATE
USING (public.can_edit_trip(trip_id))
WITH CHECK (public.can_edit_trip(trip_id));

CREATE POLICY "Trip editors can delete collaborators"
ON public.trip_collaborators
FOR DELETE
USING (public.can_edit_trip(trip_id));

-- messages
DROP POLICY IF EXISTS "Anyone can view trip messages" ON public.trip_messages;
DROP POLICY IF EXISTS "Anyone can manage trip messages" ON public.trip_messages;

CREATE POLICY "Trip members can view messages"
ON public.trip_messages
FOR SELECT
USING (public.can_view_trip(trip_id));

CREATE POLICY "Trip editors can insert messages"
ON public.trip_messages
FOR INSERT
WITH CHECK (
  public.can_edit_trip(trip_id)
  AND user_id = auth.uid()
);

CREATE POLICY "Trip editors can delete messages"
ON public.trip_messages
FOR DELETE
USING (public.can_edit_trip(trip_id));

-- votes
DROP POLICY IF EXISTS "Anyone can view trip votes" ON public.trip_votes;
DROP POLICY IF EXISTS "Anyone can manage trip votes" ON public.trip_votes;

CREATE POLICY "Trip members can view votes"
ON public.trip_votes
FOR SELECT
USING (public.can_view_trip(trip_id));

CREATE POLICY "Trip editors can insert votes"
ON public.trip_votes
FOR INSERT
WITH CHECK (
  public.can_edit_trip(trip_id)
  AND user_id = auth.uid()
);

CREATE POLICY "Trip editors can update votes"
ON public.trip_votes
FOR UPDATE
USING (public.can_edit_trip(trip_id))
WITH CHECK (
  public.can_edit_trip(trip_id)
  AND user_id = auth.uid()
);

CREATE POLICY "Trip editors can delete votes"
ON public.trip_votes
FOR DELETE
USING (public.can_edit_trip(trip_id));

-- expense splits
DROP POLICY IF EXISTS "Anyone can view trip expense splits" ON public.trip_expense_splits;
DROP POLICY IF EXISTS "Anyone can manage trip expense splits" ON public.trip_expense_splits;

CREATE POLICY "Trip members can view expense splits"
ON public.trip_expense_splits
FOR SELECT
USING (public.can_view_trip(trip_id));

CREATE POLICY "Trip editors can insert expense splits"
ON public.trip_expense_splits
FOR INSERT
WITH CHECK (public.can_edit_trip(trip_id));

CREATE POLICY "Trip editors can update expense splits"
ON public.trip_expense_splits
FOR UPDATE
USING (public.can_edit_trip(trip_id))
WITH CHECK (public.can_edit_trip(trip_id));

CREATE POLICY "Trip editors can delete expense splits"
ON public.trip_expense_splits
FOR DELETE
USING (public.can_edit_trip(trip_id));

-- price watches
DROP POLICY IF EXISTS "Anyone can view trip price watches" ON public.trip_price_watches;
DROP POLICY IF EXISTS "Anyone can manage trip price watches" ON public.trip_price_watches;

CREATE POLICY "Trip members can view price watches"
ON public.trip_price_watches
FOR SELECT
USING (public.can_view_trip(trip_id));

CREATE POLICY "Trip editors can insert price watches"
ON public.trip_price_watches
FOR INSERT
WITH CHECK (public.can_edit_trip(trip_id));

CREATE POLICY "Trip editors can update price watches"
ON public.trip_price_watches
FOR UPDATE
USING (public.can_edit_trip(trip_id))
WITH CHECK (public.can_edit_trip(trip_id));

CREATE POLICY "Trip editors can delete price watches"
ON public.trip_price_watches
FOR DELETE
USING (public.can_edit_trip(trip_id));
