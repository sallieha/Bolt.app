import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { format, subDays } from 'date-fns';

interface Stats {
  currentStreak: number;
  completionRate: number;
  activeGoals: number;
}

interface StatsStore {
  stats: Stats;
  fetchStats: () => Promise<void>;
}

export const useStatsStore = create<StatsStore>((set) => ({
  stats: {
    currentStreak: 0,
    completionRate: 0,
    activeGoals: 0,
  },

  fetchStats: async () => {
    const today = new Date();
    const thirtyDaysAgo = subDays(today, 30);

    // Get active goals count
    const { data: goals } = await supabase
      .from('goals')
      .select('id');

    // Get completions for the last 30 days
    const { data: completions } = await supabase
      .from('goal_completions')
      .select('completed_date')
      .gte('completed_date', format(thirtyDaysAgo, 'yyyy-MM-dd'))
      .lte('completed_date', format(today, 'yyyy-MM-dd'));

    if (!completions) return;

    // Calculate current streak
    let streak = 0;
    let currentDate = today;
    
    while (true) {
      const dateStr = format(currentDate, 'yyyy-MM-dd');
      const hasCompletion = completions.some(c => c.completed_date === dateStr);
      
      if (!hasCompletion) break;
      streak++;
      currentDate = subDays(currentDate, 1);
    }

    // Calculate completion rate
    const totalPossible = (goals?.length || 0) * 30;
    const completionRate = totalPossible > 0
      ? (completions.length / totalPossible) * 100
      : 0;

    set({
      stats: {
        currentStreak: streak,
        completionRate: Math.round(completionRate),
        activeGoals: goals?.length || 0,
      }
    });
  },
}));