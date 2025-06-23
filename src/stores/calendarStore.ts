import { create } from 'zustand';
import { supabase } from '../lib/supabase';

interface CalendarStore {
  downloading: boolean;
  error: string | null;
  downloadCalendar: (format: 'google' | 'ical') => Promise<void>;
}

export const useCalendarStore = create<CalendarStore>((set) => ({
  downloading: false,
  error: null,

  downloadCalendar: async (format: 'google' | 'ical') => {
    try {
      set({ downloading: true, error: null });

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/google-calendar/download`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            userId: session.user.id,
            format
          })
        }
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Failed to download calendar');
      }

      if (format === 'google') {
        // Open Google Calendar import in new tab
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        window.open('https://calendar.google.com/calendar/r/settings/export', '_blank');
        window.URL.revokeObjectURL(url);
      } else {
        // Download iCal file
        const filename = response.headers.get('Content-Disposition')?.split('filename=')[1] || 'calendar.ics';
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }

      set({ downloading: false });
    } catch (error) {
      console.error('Error downloading calendar:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to download calendar',
        downloading: false 
      });
    }
  }
}));