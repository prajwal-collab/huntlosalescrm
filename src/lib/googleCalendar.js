// ============================================
// HUNTLO SALES OS — GOOGLE CALENDAR API CLIENT
// ============================================

export async function createGoogleCalendarEvent({ token, title, description, startDateTime, durationMinutes, contactEmail, platform }) {
  const endDateTime = new Date(new Date(startDateTime).getTime() + durationMinutes * 60000).toISOString();
  
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const event = {
    summary: title,
    description: description || '',
    start: {
      dateTime: new Date(startDateTime).toISOString(),
      timeZone,
    },
    end: {
      dateTime: endDateTime,
      timeZone,
    },
    attendees: contactEmail ? [{ email: contactEmail }] : [],
  };

  if (platform === 'Google Meet') {
    event.conferenceData = {
      createRequest: {
        requestId: Math.random().toString(36).substring(2),
        conferenceSolutionKey: {
          type: 'hangoutsMeet'
        }
      }
    };
  }

  const url = new URL('https://www.googleapis.com/calendar/v3/calendars/primary/events');
  url.searchParams.append('sendUpdates', 'all');
  if (platform === 'Google Meet') {
    url.searchParams.append('conferenceDataVersion', '1');
  }

  const res = await fetch(url.toString(), {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(event)
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Google Calendar API error: ${errText}`);
  }

  const data = await res.json();
  return {
    meeting_link: data.hangoutLink || null,
    htmlLink: data.htmlLink || null,
    id: data.id
  };
}
