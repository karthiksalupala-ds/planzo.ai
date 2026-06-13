-- Security Definer function to safely delete the currently authenticated user from auth.users.
-- Since Supabase profiles and saved_trips tables use ON DELETE CASCADE, this will automatically
-- wipe all public and private data belonging to this user.

CREATE OR REPLACE FUNCTION public.delete_user_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Perform self deletion from auth.users
  DELETE FROM auth.users WHERE id = auth.uid();
END;
$$;

-- Allow only authenticated users to execute this self-deletion RPC
REVOKE ALL ON FUNCTION public.delete_user_account() FROM public;
GRANT EXECUTE ON FUNCTION public.delete_user_account() TO authenticated;
