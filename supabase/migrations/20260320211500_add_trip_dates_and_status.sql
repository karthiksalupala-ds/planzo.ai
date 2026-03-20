
-- Add start_date and status columns to saved_trips
ALTER TABLE public.saved_trips ADD COLUMN IF NOT EXISTS start_date DATE;
ALTER TABLE public.saved_trips ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'planned' CHECK (status IN ('planned', 'ongoing', 'completed'));

-- Add update policy for saved_trips (was missing)
CREATE POLICY "Users can update own trips" ON public.saved_trips FOR UPDATE USING (auth.uid() = user_id);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_saved_trips_user_start_date ON public.saved_trips(user_id, start_date);
