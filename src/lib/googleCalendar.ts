import { getSupabase } from './supabase';
import { CalendarEvent } from '../types';

export const pushEventsToGoogleCalendar = async (events: CalendarEvent[]) => {
    const supabase = getSupabase();
    if (!supabase) throw new Error("Supabase client not initialized");
    
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.provider_token;
    
    if (!token) throw new Error("No Google access token available in Supabase session");

    const results = [];
    for (const event of events) {
        // Build start/end objects
        let start: any = {};
        let end: any = {};

        if (event.startTime && event.endTime) {
            // It's a timed event. Assuming event.date is YYYY-MM-DD and time is HH:mm
            start = { dateTime: `${event.date}T${event.startTime}:00`, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone };
            end = { dateTime: `${event.date}T${event.endTime}:00`, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone };
        } else {
            // All day event. End date must be the day after start date in Google Calendar (exclusive).
            start = { date: event.date };
            const endDate = new Date(event.date);
            endDate.setDate(endDate.getDate() + 1);
            end = { date: endDate.toISOString().split('T')[0] };
        }

        const body: any = {
            summary: event.title,
            start,
            end
        };
        
        if (event.location) {
            body.location = event.location;
        }

        const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });

        if (!res.ok) {
            console.error(`Failed to push event: ${event.title}`, await res.text());
        } else {
            results.push(await res.json());
        }
    }
    
    return results;
};
