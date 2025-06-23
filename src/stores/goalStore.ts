import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { format, isBefore, parseISO } from 'date-fns';
import { getConnectionStatus } from '../lib/supabase';

interface Goal {
  id: string;
  title: string;
  description: string;
  color: string;
  frequency: string[];
  start_date: string;
  end_date: string | null;
  start_time: string;
  end_time: string;
}

interface GoalCompletion {
  id: string;
  goal_id: string;
  completed_date: string;
}

interface GoalMiss {
  id: string;
  goal_id: string;
  missed_date: string;
  reason: string;
  improvement_plan: string;
}

interface GoalStore {
  goals: Goal[];
  completions: GoalCompletion[];
  misses: GoalMiss[];
  error: string | null;
  loading: boolean;
  fetchGoals: () => Promise<void>;
  addGoal: (goal: Omit<Goal, 'id'>) => Promise<void>;
  updateGoal: (goal: Goal) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
  toggleGoalCompletion: (goalId: string, date: string) => Promise<void>;
  markGoalMissed: (goalId: string, date: string, reason: string, improvement_plan: string) => Promise<void>;
  fetchCompletions: (startDate: string, endDate: string) => Promise<void>;
  fetchMisses: (startDate: string, endDate: string) => Promise<void>;
  getGoalCompletionRate: (goalId: string, month: Date) => number;
  clearError: () => void;
}

const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000; // 1 second

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const retryWithBackoff = async <T>(
  operation: () => Promise<T>,
  retries = MAX_RETRIES,
  delay = INITIAL_RETRY_DELAY
): Promise<T> => {
  try {
    return await operation();
  } catch (error) {
    if (retries === 0) throw error;
    
    await wait(delay);
    
    return retryWithBackoff(
      operation,
      retries - 1,
      delay * 2
    );
  }
};

export const useGoalStore = create<GoalStore>((set, get) => ({
  goals: [],
  completions: [],
  misses: [],
  error: null,
  loading: false,

  clearError: () => set({ error: null }),

  fetchGoals: async () => {
    try {
      if (!getConnectionStatus()) {
        throw new Error('Database connection is not ready');
      }

      set({ loading: true, error: null });
      
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        throw new Error('Not authenticated');
      }

      const fetchOperation = async () => {
        const { data, error } = await supabase
          .from('goals')
          .select()
          .eq('user_id', user.user!.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
      };

      const data = await retryWithBackoff(fetchOperation);
      set({ goals: data || [], loading: false });
    } catch (error) {
      console.error('Error fetching goals:', error);
      const errorMessage = error instanceof Error 
        ? `Failed to fetch goals: ${error.message}`
        : 'Failed to fetch goals';
      set({ 
        error: errorMessage,
        loading: false,
        goals: []
      });
      throw error;
    }
  },

  addGoal: async (goal) => {
    try {
      if (!getConnectionStatus()) {
        throw new Error('Database connection is not ready');
      }

      set({ error: null });
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        throw new Error('Not authenticated');
      }

      const addOperation = async () => {
        const { data, error } = await supabase
          .from('goals')
          .insert([{ ...goal, user_id: user.user!.id }])
          .select()
          .single();

        if (error) throw error;
        return data;
      };

      const data = await retryWithBackoff(addOperation);
      set({ goals: [data, ...get().goals] });
    } catch (error) {
      console.error('Error adding goal:', error);
      const errorMessage = error instanceof Error 
        ? `Failed to add goal: ${error.message}`
        : 'Failed to add goal';
      set({ error: errorMessage });
      throw error;
    }
  },

  updateGoal: async (goal) => {
    try {
      if (!getConnectionStatus()) {
        throw new Error('Database connection is not ready');
      }

      set({ error: null });
      
      const updateOperation = async () => {
        const { error } = await supabase
          .from('goals')
          .update({
            title: goal.title,
            description: goal.description,
            color: goal.color,
            frequency: goal.frequency,
            start_date: goal.start_date,
            end_date: goal.end_date,
            start_time: goal.start_time,
            end_time: goal.end_time,
          })
          .eq('id', goal.id);

        if (error) throw error;
      };

      await retryWithBackoff(updateOperation);
      set({
        goals: get().goals.map(g => g.id === goal.id ? goal : g)
      });
    } catch (error) {
      console.error('Error updating goal:', error);
      const errorMessage = error instanceof Error 
        ? `Failed to update goal: ${error.message}`
        : 'Failed to update goal';
      set({ error: errorMessage });
      throw error;
    }
  },

  deleteGoal: async (id) => {
    try {
      if (!getConnectionStatus()) {
        throw new Error('Database connection is not ready');
      }

      set({ error: null });
      
      const deleteOperation = async () => {
        const { error } = await supabase
          .from('goals')
          .delete()
          .eq('id', id);

        if (error) throw error;
      };

      await retryWithBackoff(deleteOperation);
      set({ goals: get().goals.filter(goal => goal.id !== id) });
    } catch (error) {
      console.error('Error deleting goal:', error);
      const errorMessage = error instanceof Error 
        ? `Failed to delete goal: ${error.message}`
        : 'Failed to delete goal';
      set({ error: errorMessage });
      throw error;
    }
  },

  toggleGoalCompletion: async (goalId: string, date: string) => {
    try {
      if (!getConnectionStatus()) {
        throw new Error('Database connection is not ready');
      }

      set({ error: null });
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        throw new Error('Not authenticated');
      }

      const existing = get().completions.find(
        c => c.goal_id === goalId && c.completed_date === date
      );

      if (existing) {
        const deleteOperation = async () => {
          const { error } = await supabase
            .from('goal_completions')
            .delete()
            .eq('id', existing.id);

          if (error) throw error;
        };

        await retryWithBackoff(deleteOperation);
        set({
          completions: get().completions.filter(c => c.id !== existing.id)
        });
      } else {
        const toggleOperation = async () => {
          // Remove any existing miss record
          await supabase
            .from('goal_misses')
            .delete()
            .eq('goal_id', goalId)
            .eq('missed_date', date);

          const { data, error } = await supabase
            .from('goal_completions')
            .insert([{ 
              goal_id: goalId, 
              completed_date: date,
              user_id: user.user!.id
            }])
            .select()
            .single();

          if (error) throw error;
          return data;
        };

        const data = await retryWithBackoff(toggleOperation);
        set({ 
          completions: [...get().completions, data],
          misses: get().misses.filter(m => !(m.goal_id === goalId && m.missed_date === date))
        });
      }
    } catch (error) {
      console.error('Error toggling goal completion:', error);
      const errorMessage = error instanceof Error 
        ? `Failed to toggle goal completion: ${error.message}`
        : 'Failed to toggle goal completion';
      set({ error: errorMessage });
      throw error;
    }
  },

  markGoalMissed: async (goalId: string, date: string, reason: string, improvement_plan: string) => {
    try {
      if (!getConnectionStatus()) {
        throw new Error('Database connection is not ready');
      }

      set({ error: null });
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        throw new Error('Not authenticated');
      }

      const markMissedOperation = async () => {
        // Check for existing miss record
        const { data: existingMiss, error: fetchError } = await supabase
          .from('goal_misses')
          .select()
          .eq('goal_id', goalId)
          .eq('missed_date', date)
          .maybeSingle();

        if (fetchError) throw fetchError;

        if (existingMiss) {
          const { data, error } = await supabase
            .from('goal_misses')
            .update({ reason, improvement_plan })
            .eq('id', existingMiss.id)
            .select()
            .single();

          if (error) throw error;
          return { data, isNew: false };
        } else {
          // Remove any existing completion
          await supabase
            .from('goal_completions')
            .delete()
            .eq('goal_id', goalId)
            .eq('completed_date', date);

          const { data, error } = await supabase
            .from('goal_misses')
            .insert([{
              goal_id: goalId,
              missed_date: date,
              reason,
              improvement_plan,
              user_id: user.user!.id
            }])
            .select()
            .single();

          if (error) throw error;
          return { data, isNew: true };
        }
      };

      const { data, isNew } = await retryWithBackoff(markMissedOperation);
      
      if (isNew) {
        set({
          misses: [...get().misses, data],
          completions: get().completions.filter(c => !(c.goal_id === goalId && c.completed_date === date))
        });
      } else {
        set({
          misses: get().misses.map(m => m.id === data.id ? data : m)
        });
      }

      return data;
    } catch (error) {
      console.error('Error marking goal as missed:', error);
      const errorMessage = error instanceof Error 
        ? `Failed to mark goal as missed: ${error.message}`
        : 'Failed to mark goal as missed';
      set({ error: errorMessage });
      throw error;
    }
  },

  fetchCompletions: async (startDate: string, endDate: string) => {
    try {
      if (!getConnectionStatus()) {
        throw new Error('Database connection is not ready');
      }

      set({ error: null });
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        throw new Error('Not authenticated');
      }

      const fetchOperation = async () => {
        const { data, error } = await supabase
          .from('goal_completions')
          .select()
          .eq('user_id', user.user!.id)
          .gte('completed_date', startDate)
          .lte('completed_date', endDate);

        if (error) throw error;
        return data;
      };

      const data = await retryWithBackoff(fetchOperation);
      set({ completions: data || [] });
    } catch (error) {
      console.error('Error fetching completions:', error);
      const errorMessage = error instanceof Error 
        ? `Failed to fetch completions: ${error.message}`
        : 'Failed to fetch completions';
      set({ 
        error: errorMessage,
        completions: []
      });
      throw error;
    }
  },

  fetchMisses: async (startDate: string, endDate: string) => {
    try {
      if (!getConnectionStatus()) {
        throw new Error('Database connection is not ready');
      }

      set({ error: null });
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        throw new Error('Not authenticated');
      }

      const fetchOperation = async () => {
        const { data, error } = await supabase
          .from('goal_misses')
          .select()
          .eq('user_id', user.user!.id)
          .gte('missed_date', startDate)
          .lte('missed_date', endDate)
          .order('missed_date', { ascending: false });

        if (error) throw error;
        return data;
      };

      const data = await retryWithBackoff(fetchOperation);
      set({ misses: data || [] });
    } catch (error) {
      console.error('Error fetching misses:', error);
      const errorMessage = error instanceof Error 
        ? `Failed to fetch misses: ${error.message}`
        : 'Failed to fetch misses';
      set({ 
        error: errorMessage,
        misses: []
      });
      throw error;
    }
  },

  getGoalCompletionRate: (goalId: string, month: Date) => {
    const goal = get().goals.find(g => g.id === goalId);
    if (!goal) return 0;

    const startDate = new Date(month.getFullYear(), month.getMonth(), 1);
    const endDate = new Date(month.getFullYear(), month.getMonth() + 1, 0);
    const goalStartDate = parseISO(goal.start_date);
    
    let totalDays = 0;
    let completedDays = 0;
    
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      if (!isBefore(d, goalStartDate)) {
        const dayOfWeek = d.toLocaleDateString('en-US', { weekday: 'long' });
        if (goal.frequency.includes(dayOfWeek)) {
          totalDays++;
          const dateStr = format(d, 'yyyy-MM-dd');
          if (get().completions.some(c => c.goal_id === goalId && c.completed_date === dateStr)) {
            completedDays++;
          }
        }
      }
    }
    
    return totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0;
  },
}));