
-- Migration: Add trip_cache, request_logs and improve saved_trips schema
-- Created based on user provided database diagram

-- 1. Create trip_cache for caching AI responses
CREATE TABLE IF NOT EXISTS public.trip_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query_hash TEXT UNIQUE NOT NULL,
  response_json JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast cache lookups
CREATE INDEX IF NOT EXISTS idx_trip_cache_query_hash ON public.trip_cache(query_hash);

-- 2. Create request_logs for tracking API usage and errors
CREATE TABLE IF NOT EXISTS public.request_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  request_timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  execution_time_ms INTEGER,
  cache_hit BOOLEAN DEFAULT false,
  status_code INTEGER,
  error_details TEXT,
  metadata JSONB
);

-- Index for analytics lookups
CREATE INDEX IF NOT EXISTS idx_request_logs_user_id ON public.request_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_request_logs_timestamp ON public.request_logs(request_timestamp);

-- 3. Upgrade saved_trips.budget from TEXT to NUMERIC for better calculations
-- Handles cases where budget might contain currency symbols or commas
ALTER TABLE public.saved_trips 
  ALTER COLUMN budget TYPE NUMERIC(10,2) 
  USING (NULLIF(regexp_replace(budget, '[^0-9.]', '', 'g'), '')::NUMERIC);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.trip_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.request_logs ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies

-- Trip Cache: Readable by everyone to avoid duplicate AI requests
DROP POLICY IF EXISTS "Anyone can read trip cache" ON public.trip_cache;
CREATE POLICY "Anyone can read trip cache" 
  ON public.trip_cache FOR SELECT 
  USING (true);

DROP POLICY IF EXISTS "System can insert into cache" ON public.trip_cache;
CREATE POLICY "System can insert into cache" 
  ON public.trip_cache FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'anon');

-- Request Logs: Users can only see their own logs
DROP POLICY IF EXISTS "Users can view own logs" ON public.request_logs;
CREATE POLICY "Users can view own logs" 
  ON public.request_logs FOR SELECT 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users/System can insert logs" ON public.request_logs;
CREATE POLICY "Users/System can insert logs" 
  ON public.request_logs FOR INSERT 
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
