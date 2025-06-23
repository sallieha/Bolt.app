import { create } from 'zustand';
import { supabase } from '../lib/supabase';

interface Avatar {
  id: string;
  name: string;
  emoji: string;
  color: string;
}

interface UserProfile {
  id: string;
  user_id: string;
  avatar_id: string;
  avatar?: Avatar;
}

interface AvatarState {
  avatars: Avatar[];
  userProfile: UserProfile | null;
  error: string | null;
  loading: boolean;
  fetchAvatars: () => Promise<void>;
  fetchUserProfile: () => Promise<void>;
  setUserAvatar: (avatarId: string) => Promise<void>;
  clearError: () => void;
}

export const useAvatarStore = create<AvatarState>((set, get) => ({
  avatars: [],
  userProfile: null,
  error: null,
  loading: false,

  clearError: () => set({ error: null }),

  fetchAvatars: async () => {
    try {
      set({ loading: true, error: null });
      const { data: avatars, error } = await supabase
        .from('avatars')
        .select('*')
        .order('name');

      if (error) throw error;
      set({ avatars: avatars || [], loading: false });
    } catch (error) {
      console.error('Error fetching avatars:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch avatars',
        loading: false 
      });
    }
  },

  fetchUserProfile: async () => {
    try {
      set({ loading: true, error: null });
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');

      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select(`
          id,
          user_id,
          avatar_id,
          avatar:avatars (
            id,
            name,
            emoji,
            color
          )
        `)
        .eq('user_id', user.user.id)
        .single();

      if (error) {
        // If profile doesn't exist, create one with a random avatar
        if (error.code === 'PGRST116') {
          const { data: randomAvatar } = await supabase
            .from('avatars')
            .select('id')
            .limit(1)
            .single();

          if (randomAvatar) {
            const { data: newProfile, error: createError } = await supabase
              .from('user_profiles')
              .insert([{
                user_id: user.user.id,
                avatar_id: randomAvatar.id
              }])
              .select(`
                id,
                user_id,
                avatar_id,
                avatar:avatars (
                  id,
                  name,
                  emoji,
                  color
                )
              `)
              .single();

            if (createError) throw createError;
            set({ userProfile: newProfile, loading: false });
            return;
          }
        }
        throw error;
      }

      set({ userProfile: profile, loading: false });
    } catch (error) {
      console.error('Error fetching user profile:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch user profile',
        loading: false 
      });
    }
  },

  setUserAvatar: async (avatarId: string) => {
    try {
      set({ loading: true, error: null });
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');

      const { data: profile, error } = await supabase
        .from('user_profiles')
        .update({ avatar_id: avatarId })
        .eq('user_id', user.user.id)
        .select(`
          id,
          user_id,
          avatar_id,
          avatar:avatars (
            id,
            name,
            emoji,
            color
          )
        `)
        .single();

      if (error) throw error;
      set({ userProfile: profile, loading: false });
    } catch (error) {
      console.error('Error updating avatar:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to update avatar',
        loading: false 
      });
    }
  },
}));