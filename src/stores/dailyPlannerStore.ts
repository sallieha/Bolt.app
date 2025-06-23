import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { format, parseISO } from 'date-fns';
import { useGoalStore } from './goalStore';

interface Task {
  id: string;
  content: string;
  startTime: string;
  endTime: string;
  date: string;
  isGoal?: boolean;
  color?: string;
}

interface DailyPlannerStore {
  tasks: Task[];
  loading: boolean;
  error: string | null;
  fetchTasks: (date: Date) => Promise<void>;
  addTask: (task: Omit<Task, 'id'>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  clearError: () => void;
}

export const useDailyPlannerStore = create<DailyPlannerStore>((set, get) => ({
  tasks: [],
  loading: false,
  error: null,

  clearError: () => set({ error: null }),

  fetchTasks: async (date: Date) => {
    try {
      set({ loading: true, error: null });
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        throw new Error('Not authenticated');
      }

      const dateStr = format(date, 'yyyy-MM-dd');
      
      // Fetch regular tasks
      const { data: taskData, error: taskError } = await supabase
        .from('daily_tasks')
        .select()
        .eq('user_id', user.user.id)
        .eq('date', dateStr)
        .order('start_time', { ascending: true });

      if (taskError) throw taskError;

      // Get goals for the current day
      const { goals } = useGoalStore.getState();
      const dayOfWeek = format(date, 'EEEE');
      const todaysGoals = goals.filter(goal => {
        const startDate = parseISO(goal.start_date);
        const endDate = goal.end_date ? parseISO(goal.end_date) : null;
        const isAfterStart = date >= startDate;
        const isBeforeEnd = endDate ? date <= endDate : true;
        return isAfterStart && isBeforeEnd && goal.frequency.includes(dayOfWeek);
      });

      // Format regular tasks
      const formattedTasks = taskData.map(task => ({
        id: task.id,
        content: task.content,
        startTime: format(new Date(`2000-01-01T${task.start_time}`), 'HH:mm'),
        endTime: format(new Date(`2000-01-01T${task.end_time}`), 'HH:mm'),
        date: task.date,
        isGoal: false
      }));

      // Format goals as tasks
      const goalTasks = todaysGoals.map(goal => ({
        id: `goal-${goal.id}`,
        content: goal.title,
        startTime: goal.start_time,
        endTime: goal.end_time,
        date: dateStr,
        isGoal: true,
        color: goal.color
      }));

      // Combine and sort all tasks by start time
      const allTasks = [...formattedTasks, ...goalTasks].sort((a, b) => 
        a.startTime.localeCompare(b.startTime)
      );

      set({ tasks: allTasks, loading: false });
    } catch (error) {
      console.error('Error fetching tasks:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch tasks',
        loading: false 
      });
    }
  },

  addTask: async (task) => {
    try {
      set({ error: null });
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        throw new Error('Not authenticated');
      }

      const { data, error } = await supabase
        .from('daily_tasks')
        .insert([{
          content: task.content,
          start_time: task.startTime,
          end_time: task.endTime,
          date: task.date,
          user_id: user.user.id
        }])
        .select()
        .single();

      if (error) throw error;

      const formattedTask = {
        id: data.id,
        content: data.content,
        startTime: format(new Date(`2000-01-01T${data.start_time}`), 'HH:mm'),
        endTime: format(new Date(`2000-01-01T${data.end_time}`), 'HH:mm'),
        date: data.date,
        isGoal: false
      };

      const tasks = [...get().tasks, formattedTask].sort((a, b) => 
        a.startTime.localeCompare(b.startTime)
      );
      set({ tasks });
    } catch (error) {
      console.error('Error adding task:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to add task' });
    }
  },

  deleteTask: async (id: string) => {
    try {
      set({ error: null });
      // Only delete if it's not a goal task
      if (!id.startsWith('goal-')) {
        const { error } = await supabase
          .from('daily_tasks')
          .delete()
          .eq('id', id);

        if (error) throw error;
      }
      set({ tasks: get().tasks.filter(task => task.id !== id) });
    } catch (error) {
      console.error('Error deleting task:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to delete task' });
    }
  }
}));