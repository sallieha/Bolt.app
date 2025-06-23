import { create } from 'zustand';
import { supabase } from '../lib/supabase';

interface Mood {
  id: string;
  mood: string;
  created_at: string;
}

interface MoodStore {
  todaysMood: Mood | null;
  moods: Mood[];
  error: string | null;
  loading: boolean;
  setTodaysMood: (mood: string) => Promise<void>;
  fetchTodaysMood: () => Promise<void>;
  fetchMonthMoods: (startDate: string, endDate: string) => Promise<void>;
  clearError: () => void;
}

export const useMoodStore = create<MoodStore>((set) => ({
  todaysMood: null,
  moods: [],
  error: null,
  loading: false,

  clearError: () => set({ error: null }),

  setTodaysMood: async (mood: string) => {
    try {
      set({ loading: true, error: null });
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        throw new Error('Not authenticated');
      }

      const { data, error } = await supabase
        .from('moods')
        .insert([{ 
          mood,
          user_id: user.user.id 
        }])
        .select()
        .single();

      if (error) throw error;
      set({ todaysMood: data, loading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to set mood',
        loading: false
      });
      throw error;
    }
  },

  fetchTodaysMood: async () => {
    try {
      set({ loading: true, error: null });
      const today = new Date().toISOString().split('T')[0];
      const tomorrow = new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('moods')
        .select()
        .gte('created_at', today)
        .lt('created_at', tomorrow)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      set({ todaysMood: data, loading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch today\'s mood',
        loading: false,
        todaysMood: null
      });
      throw error;
    }
  },

  fetchMonthMoods: async (startDate: string, endDate: string) => {
    try {
      set({ loading: true, error: null });
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        throw new Error('Not authenticated');
      }

      const { data, error } = await supabase
        .from('moods')
        .select()
        .eq('user_id', user.user.id)
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .order('created_at', { ascending: true });

      if (error) throw error;
      set({ moods: data || [], loading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch month moods',
        loading: false,
        moods: []
      });
      throw error;
    }
  },
}));