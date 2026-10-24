import { supabase } from '@/utils/supabase';
import { AuthChangeEvent, Session } from '@supabase/supabase-js';

export const signIn = async (email: string, password: string): Promise<Session | null> => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data.session;
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

export const getSession = async (): Promise<Session | null> => {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
};

export const onAuthChange = (cb: (event: AuthChangeEvent, session: Session | null) => void) => {
  const { data } = supabase.auth.onAuthStateChange((event, session) => {
    cb(event, session);
  });
  return data.subscription;
};
