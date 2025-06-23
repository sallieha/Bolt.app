import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { format, subDays } from 'date-fns';

interface HourlyEnergyLevel {
  id: string;
  hour: number;
  level: number;
  date: string;
  notes?: string;
  recorded_at: string;
}

interface HourlyAverage {
  hour: number;
  averageLevel: number;
  recordCount: number;
}

interface EnergyStore {
  hourlyLevels: HourlyEnergyLevel[];
  hourlyAverages: HourlyAverage[];
  error: string | null;
  loading: boolean;
  fetchHourlyLevels: (date: Date) => Promise<void>;
  fetchHourlyAverages: () => Promise<void>;
  setHourlyLevel: (hour: number, level: number, date: Date) => Promise<void>;
  clearError: () => void;
}

const formatDateForDB = (date: Date): string => {
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    throw new Error('Invalid date provided');
  }
  return format(date, 'yyyy-MM-dd');
};

export const useEnergyStore = create<EnergyStore>((set, get) => ({
  hourlyLevels: [],
  hourlyAverages: [],
  error: null,
  loading: false,

  clearError: () => set({ error: null }),

  fetchHourlyAverages: async () => {
    try {
      set({ loading: true, error: null });
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        set({ loading: false });
        return;
      }

      const thirtyDaysAgo = formatDateForDB(subDays(new Date(), 30));
      const today = formatDateForDB(new Date());

      const { data, error } = await supabase
        .from('hourly_energy_levels')
        .select('hour, level')
        .eq('user_id', user.user.id)
        .gte('date', thirtyDaysAgo)
        .lte('date', today);

      if (error) throw error;

      // Calculate averages for each hour
      const hourlyData: { [hour: number]: { total: number; count: number } } = {};
      
      // Initialize all hours
      for (let i = 0; i < 24; i++) {
        hourlyData[i] = { total: 0, count: 0 };
      }

      // Sum up levels and count records for each hour
      data?.forEach(record => {
        hourlyData[record.hour].total += record.level;
        hourlyData[record.hour].count += 1;
      });

      // Convert to averages array
      const averages = Object.entries(hourlyData).map(([hour, data]) => ({
        hour: parseInt(hour),
        averageLevel: data.count > 0 ? Number((data.total / data.count).toFixed(2)) : 0,
        recordCount: data.count
      })).sort((a, b) => a.hour - b.hour);

      set({ hourlyAverages: averages, loading: false });
    } catch (error) {
      console.error('Error fetching hourly averages:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch averages',
        loading: false 
      });
    }
  },

  fetchHourlyLevels: async (date: Date) => {
    try {
      set({ loading: true, error: null });
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        set({ loading: false });
        return;
      }

      const formattedDate = formatDateForDB(date);

      const { data, error } = await supabase
        .from('hourly_energy_levels')
        .select('*')
        .eq('user_id', user.user.id)
        .eq('date', formattedDate)
        .order('hour', { ascending: true });

      if (error) throw error;
      set({ hourlyLevels: data || [], loading: false });
    } catch (error) {
      console.error('Error fetching hourly energy levels:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch energy levels',
        loading: false 
      });
    }
  },

  setHourlyLevel: async (hour: number, level: number, date: Date) => {
    try {
      set({ error: null });
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        throw new Error('User not authenticated');
      }

      const formattedDate = formatDateForDB(date);

      // Check if a record already exists for this hour
      const { data: existingRecord } = await supabase
        .from('hourly_energy_levels')
        .select('id')
        .eq('user_id', user.user.id)
        .eq('date', formattedDate)
        .eq('hour', hour)
        .maybeSingle();

      let result;
      
      if (existingRecord) {
        // Update existing record
        const { data, error } = await supabase
          .from('hourly_energy_levels')
          .update({
            level,
            recorded_at: new Date().toISOString()
          })
          .eq('id', existingRecord.id)
          .select()
          .single();

        if (error) throw error;
        result = data;
      } else {
        // Insert new record
        const { data, error } = await supabase
          .from('hourly_energy_levels')
          .insert({
            user_id: user.user.id,
            hour,
            level,
            date: formattedDate,
            recorded_at: new Date().toISOString()
          })
          .select()
          .single();

        if (error) throw error;
        result = data;
      }

      // Update local state
      set(state => ({
        hourlyLevels: [
          ...state.hourlyLevels.filter(e => e.id !== result.id),
          result
        ].sort((a, b) => a.hour - b.hour)
      }));

      // Refresh averages after setting a new level
      await get().fetchHourlyAverages();
    } catch (error) {
      console.error('Error setting hourly energy level:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to set energy level' });
      throw error;
    }
  }
}));