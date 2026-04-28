const CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID;
const CALENDAR_ID = process.env.REACT_APP_CALENDAR_ID;
const SCOPES = 'https://www.googleapis.com/auth/calendar';
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest';

let tokenClient = null;
let gapiInited = false;
let gisInited = false;

export function initializeGapi(onReady) {
  const script = document.createElement('script');
  script.src = 'https://apis.google.com/js/api.js';
  script.onload = () => {
    window.gapi.load('client', async () => {
      await window.gapi.client.init({
        discoveryDocs: [DISCOVERY_DOC],
      });
      gapiInited = true;
      if (gisInited && onReady) onReady();
    });
  };
  document.body.appendChild(script);

  const gisScript = document.createElement('script');
  gisScript.src = 'https://accounts.google.com/gsi/client';
  gisScript.onload = () => {
    tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPES,
      callback: '',
    });
    gisInited = true;
    if (gapiInited && onReady) onReady();
  };
  document.body.appendChild(gisScript);
}

export function signIn() {
  return new Promise((resolve, reject) => {
    tokenClient.callback = (resp) => {
      if (resp.error) {
        reject(resp);
        return;
      }
      resolve(resp);
    };
    if (window.gapi.client.getToken() === null) {
      tokenClient.requestAccessToken({ prompt: 'consent' });
    } else {
      tokenClient.requestAccessToken({ prompt: '' });
    }
  });
}

export function signOut() {
  const token = window.gapi.client.getToken();
  if (token !== null) {
    window.google.accounts.oauth2.revoke(token.access_token);
    window.gapi.client.setToken('');
  }
}

export function isSignedIn() {
  return window.gapi && window.gapi.client && window.gapi.client.getToken() !== null;
}

export async function listEvents(timeMin, timeMax) {
  const response = await window.gapi.client.calendar.events.list({
    calendarId: CALENDAR_ID,
    timeMin: timeMin.toISOString(),
    timeMax: timeMax.toISOString(),
    showDeleted: false,
    singleEvents: true,
    maxResults: 500,
    orderBy: 'startTime',
  });
  return response.result.items || [];
}

export async function createEvent(eventData) {
  const { title, author, category, description, startDate, endDate, isAllDay, recurrence } = eventData;

  const event = {
    summary: `[${author}] ${title}`,
    description: `${category}/${author}/${description || ''}`,
    start: isAllDay
      ? { date: startDate }
      : { dateTime: startDate, timeZone: 'Asia/Seoul' },
    end: isAllDay
      ? { date: endDate }
      : { dateTime: endDate, timeZone: 'Asia/Seoul' },
  };

  if (recurrence && recurrence !== 'NONE') {
    event.recurrence = [`RRULE:FREQ=${recurrence}`];
  }

  const response = await window.gapi.client.calendar.events.insert({
    calendarId: CALENDAR_ID,
    resource: event,
  });
  return response.result;
}

export async function updateEvent(eventId, eventData) {
  const { title, author, category, description, startDate, endDate, isAllDay, recurrence } = eventData;

  const event = {
    summary: `[${author}] ${title}`,
    description: `${category}/${author}/${description || ''}`,
    start: isAllDay
      ? { date: startDate }
      : { dateTime: startDate, timeZone: 'Asia/Seoul' },
    end: isAllDay
      ? { date: endDate }
      : { dateTime: endDate, timeZone: 'Asia/Seoul' },
  };

  if (recurrence && recurrence !== 'NONE') {
    event.recurrence = [`RRULE:FREQ=${recurrence}`];
  } else {
    event.recurrence = [];
  }

  const response = await window.gapi.client.calendar.events.update({
    calendarId: CALENDAR_ID,
    eventId: eventId,
    resource: event,
  });
  return response.result;
}

export async function deleteEvent(eventId) {
  await window.gapi.client.calendar.events.delete({
    calendarId: CALENDAR_ID,
    eventId: eventId,
  });
}

export function parseEventDescription(description) {
  if (!description) return { category: '', author: '', detail: '' };
  const parts = description.split('/');
  return {
    category: parts[0] || '',
    author: parts[1] || '',
    detail: parts.slice(2).join('/') || '',
  };
}

export function parseEventSummary(summary) {
  if (!summary) return { author: '', title: '' };
  const match = summary.match(/^\[(.+?)\]\s*(.+)$/);
  if (match) {
    return { author: match[1], title: match[2] };
  }
  return { author: '', title: summary };
}
