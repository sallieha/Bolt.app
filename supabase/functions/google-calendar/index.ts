import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const path = url.pathname.split('/').pop();

    if (path === 'download') {
      const { format = 'ical' } = await req.json();
      
      // Generate sample ICS file content
      const now = new Date();
      const tomorrow = new Date(now.setDate(now.getDate() + 1));
      
      const icsContent = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//FocusFlow//Calendar Export//EN',
        'BEGIN:VEVENT',
        `DTSTART:${tomorrow.toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
        `DTEND:${new Date(tomorrow.setHours(tomorrow.getHours() + 1)).toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
        'SUMMARY:Sample Calendar Event',
        'DESCRIPTION:This is a sample calendar event from FocusFlow',
        'END:VEVENT',
        'END:VCALENDAR'
      ].join('\r\n');

      const filename = format === 'google' ? 'google-calendar.ics' : 'focusflow-calendar.ics';

      return new Response(icsContent, {
        headers: {
          'Content-Type': 'text/calendar',
          'Content-Disposition': `attachment; filename=${filename}`,
          ...corsHeaders
        }
      });
    }

    throw new Error('Invalid endpoint');
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      }
    );
  }
});