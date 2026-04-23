-- Add new columns to servers table
ALTER TABLE public.servers 
ADD COLUMN IF NOT EXISTS features TEXT,
ADD COLUMN IF NOT EXISTS events_time TEXT,
ADD COLUMN IF NOT EXISTS upcoming_updates TEXT,
ADD COLUMN IF NOT EXISTS profile_visits INTEGER NOT NULL DEFAULT 0;

-- Function to increment profile visits atomically
CREATE OR REPLACE FUNCTION public.increment_profile_visits(server_id_input BIGINT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.servers
  SET profile_visits = profile_visits + 1
  WHERE id = server_id_input;
END;
$$;
