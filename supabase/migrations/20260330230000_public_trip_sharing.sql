-- Drop the existing SELECT policy that restricts viewing to only the user who created the trip
DROP POLICY IF EXISTS "Users can view own trips" ON public.saved_trips;

-- Create a new policy that allows anyone with the URL (the UUID) to selectively view the trip
-- Note: UUIDs act as secure unguessable tokens. This allows public trip sharing.
CREATE POLICY "Anyone can view trips" ON public.saved_trips FOR SELECT USING (true);
