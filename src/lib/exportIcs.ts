import { CalendarEvent, FamilyMember } from '../types';
export function exportEventsToICS(events: CalendarEvent[], familyMembers: FamilyMember[]) {
  const formatDateTime = (dateStr: string, timeStr?: string) => {
    // dateStr is YYYY-MM-DD
    // timeStr is HH:mm or undefined
    if (!timeStr) {
      // All day event, ICS format YYYYMMDD
      return dateStr.replace(/-/g, '');
    }
    const [year, month, day] = dateStr.split('-');
    const [hour, minute] = timeStr.split(':');
    
    // Naive local time export mapping to UTC without Z can be tricky, 
    // but just treating it as floating time is usually acceptable for personal configs
    return `${year}${month}${day}T${hour}${minute}00`;
  };

  const escapeText = (text: string) => {
    return text.replace(/[\\;,]/g, '\\$&').replace(/\n/g, '\\n');
  };

  let icsLines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//AI Studio Build//Family Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH'
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
  const link = document.createElement('url');
  
  // For standard HTML 5 download
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'family_calendar.ics';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
