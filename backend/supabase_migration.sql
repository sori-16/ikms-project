-- IKMS Supabase Schema Migration
-- Run this in your Supabase SQL Editor to update the tables for the new features.

-- 1. Add new Scholar Profile columns to the "users" table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS date_of_birth DATE,
ADD COLUMN IF NOT EXISTS occupation TEXT,
ADD COLUMN IF NOT EXISTS photo_url TEXT,
ADD COLUMN IF NOT EXISTS research_interests TEXT;

-- 2. Add is_external_match to "documents" table
ALTER TABLE public.documents
ADD COLUMN IF NOT EXISTS is_external_match BOOLEAN DEFAULT FALSE;

-- 3. (Optional) Create moderation_logs table if you are tracking logs in Cloud now
CREATE TABLE IF NOT EXISTS public.moderation_logs (
    id SERIAL PRIMARY KEY,
    document_id INTEGER REFERENCES public.documents(id) ON DELETE CASCADE,
    admin_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    notes TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);
