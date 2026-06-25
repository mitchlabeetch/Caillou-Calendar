import { CalendarEvent, FamilyMember } from '../types';
import { getActiveTimeZone } from './timezone';
export function exportEventsToICS(events: CalendarEvent[], familyMembers: FamilyMember[]) {
  const tz = getActiveTimeZone();
  const escapeText = (text: string) => {
    return text.replace(/[\\;,]/g, '\\$&').replace(/\n/g, '\\n');
  };

  /**
   * Convert a wall-clock `(date, time)` to a UTC ICS datetime string.
   * Previously this exported floating times (`...T090000`) which most
   * calendar apps interpret as the *recipient's* local time, so a
   * 9 AM event in Paris would become 9 AM in Sydney. We now emit UTC
   * with a `Z` suffix, which is unambiguous.
   */
  const toUtc = (dateStr: string, timeStr: string): string => {
    const [year, month, day] = dateStr.split('-').map(Number);
    const [hour, minute] = timeStr.split(':').map(Number);
    // Build the wall-clock moment in the active timezone, then convert
    // to UTC. We treat the wall clock as if it were UTC for arithmetic
    // and accept a small offset — for family use this is the right
    // trade-off vs. floating times.
    const wall = new Date(Date.UTC(year, month - 1, day, hour, minute, 0));
    // Use the IANA offset for the active timezone at that wall moment
    // to shift to true UTC.
    try {
      const utcDate = new Date(wall.toLocaleString('en-US', { timeZone: tz }));
      const offsetMs = wall.getTime() - utcDate.getTime();
      const utc = new Date(wall.getTime() + offsetMs);
      return utc.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    } catch {
      return wall.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    }
  };

  const formatDateTime = (dateStr: string, timeStr?: string) => {
    if (!timeStr) {
      // All day event, ICS format YYYYMMDD
      return dateStr.replace(/-/g, '');
    }
    return toUtc(dateStr, timeStr);
  };

  let icsLines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Caillou//Family Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-TIMEZONE:${tz}`,
  ];

  for (const event of events) {
    icsLines.push('BEGIN:VEVENT');
    
    // Generate a unique ID (UID)
    icsLines.push(`UID:${event.id}@familycalendar`);
    
    // Provide a simple timestamp for when this was created/exported
    const now = new Date();
    const dtStamp = now.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    icsLines.push(`DTSTAMP:${dtStamp}`);

    if (event.startTime) {
      icsLines.push(`DTSTART:${formatDateTime(event.date, event.startTime)}`);
      if (event.endTime) {
        icsLines.push(`DTEND:${formatDateTime(event.date, event.endTime)}`);
      } else {
        // If there's a start time but no end time, assume 1 hour later
        const [hour, min] = event.startTime.split(':');
        let endHour = parseInt(hour, 10) + 1;
        let endMin = min;
        if (endHour >= 24) { endHour = 23; endMin = '59'; }
        icsLines.push(`DTEND:${formatDateTime(event.date, `${endHour.toString().padStart(2, '0')}:${endMin}`)}`);
      }
    } else {
      // All day event
      icsLines.push(`DTSTART;VALUE=DATE:${formatDateTime(event.date)}`);
      // For all day event, end date is non-inclusive, should add a day, but for simplicity we skip DTEND here, mostly it defaults to 1 day
    }

    icsLines.push(`SUMMARY:${escapeText(event.title)}`);

    if (event.location) {
      icsLines.push(`LOCATION:${escapeText(event.location)}`);
    }

    // Include members in description
    if (event.memberIds && event.memberIds.length > 0) {
      const memberNames = event.memberIds
        .map(id => familyMembers.find(m => m.id === id)?.name)
        .filter(Boolean)
        .join(', ');
      if (memberNames) {
        icsLines.push(`DESCRIPTION:Members: ${escapeText(memberNames)}`);
      }
    }

    icsLines.push('END:VEVENT');
  }

  icsLines.push('END:VCALENDAR');

  const icsData = icsLines.join('\r\n');
  
  // Download logic
  const blob = new Blob([icsData], { type: 'text/calendar;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'family_calendar.ics';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
