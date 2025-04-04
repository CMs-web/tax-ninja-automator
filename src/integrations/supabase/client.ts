import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://sjqezbfqmwfwbutgzwqd.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNqcWV6YmZxbXdmd2J1dGd6d3FkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM3OTEzODUsImV4cCI6MjA1OTM2NzM4NX0.8i9Iws3d3STiftVM_BpVBTkKJ1cpzzUId36BnorQRdY";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  }
});

// Auth helpers
export const signIn = async (email: string, password: string) => {
  return supabase.auth.signInWithPassword({ email, password });
};

export const signUp = async (email: string, password: string) => {
  return supabase.auth.signUp({ email, password });
};

export const signOut = async () => {
  return supabase.auth.signOut();
};

export const getCurrentUser = async () => {
  return supabase.auth.getUser();
};

export const getCurrentSession = async () => {
  return supabase.auth.getSession();
};
