import { create } from 'zustand';
import type { Session, Subscription } from '@supabase/supabase-js';
import * as authCrud from '@/crud/auth';

type AuthStore = {
  session: Session | null;
  isLoading: boolean;
  error: string | null;
  init: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

// Kept outside the store so a second init() replaces the listener instead of adding one
let subscription: Subscription | null = null;

export const useAuthStore = create<AuthStore>((set) => ({
  session: null,
  isLoading: true,
  error: null,

  init: async () => {
    subscription?.unsubscribe();
    subscription = authCrud.onAuthChange((_event, session) => set({ session }));

    try {
      const session = await authCrud.getSession();
      set({ session });
    } catch (error) {
      console.error('Error fetching session:', error);
      set({ session: null });
    } finally {
      set({ isLoading: false });
    }
  },

  signIn: async (email, password) => {
    set({ error: null });
    try {
      await authCrud.signIn(email, password);
    } catch {
      set({ error: 'Forkert email eller adgangskode' });
    }
  },

  signOut: async () => {
    try {
      await authCrud.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
      set({ error: 'Kunne ikke logge ud' });
    }
  },
}));