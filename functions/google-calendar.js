/**
 * Intel Booking — Google Calendar Integration
 *
 * Uses the Calendar REST API directly via fetch (no googleapis dependency)
 * to avoid googleapis-common/google-auth-library OAuth issues in Cloud Run.
 */

const CALENDAR_API = 'https://www.googleapis.com/calendar/v3';
const TOKEN_URL    = 'https://oauth2.googleapis.com/token';

// ─── Configuration ────────────────────────────────────────────────────────────

function getEnv() {
  const trim = v => v?.trim();
  const cfg = {
    ACCOUNT_MANAGER_EMAIL: trim(process.env.ACCOUNT_MANAGER_EMAIL),
    GOOGLE_CLIENT_ID:      trim(process.env.GOOGLE_CLIENT_ID),
    GOOGLE_CLIENT_SECRET:  trim(process.env.GOOGLE_CLIENT_SECRET),
    GOOGLE_REFRESH_TOKEN:  trim(process.env.GOOGLE_REFRESH_TOKEN),
    BOOKING_BASE_URL:      trim(process.env.BOOKING_BASE_URL)     || 'https://intel-booking.web.app',
    TRAINING_CALENDAR_ID:  trim(process.env.TRAINING_CALENDAR_ID) || 'primary',
  };
  for (const key of ['ACCOUNT_MANAGER_EMAIL', 'GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'GOOGLE_REFRESH_TOKEN']) {
    if (!cfg[key]) throw new Error(`Missing required environment variable: ${key}`);
  }
  return cfg;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

async function getAccessToken() {
  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN } = getEnv();
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id:     GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      refresh_token: GOOGLE_REFRESH_TOKEN,
      grant_type:    'refresh_token',
    }).toString(),
  });
  const data = await res.json();
  if (!data.access_token) throw new Error(`Token refresh failed: ${JSON.stringify(data)}`);
  return data.access_token;
}

async function calendarFetch(method, path, body) {
  const token = await getAccessToken();
  const res = await fetch(`${CALENDAR_API}${path}`, {
    method,
    headers: {
      Authorization:  `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Calendar API error ${res.status}: ${JSON.stringify(data)}`);
  return data;
}

// ─── Core: Create calendar event from booking ─────────────────────────────────

export async function createBookingCalendarEvent(booking) {
  const { ACCOUNT_MANAGER_EMAIL, TRAINING_CALENDAR_ID } = getEnv();

  const event = {
    summary:     `📋 ${booking.trainingTitle} — ${booking.companyName}`,
    location:    booking.location,
    description: buildEventDescription(booking),
    start: { dateTime: booking.startDateTime, timeZone: 'Europe/Amsterdam' },
    end:   { dateTime: booking.endDateTime,   timeZone: 'Europe/Amsterdam' },
    attendees: [
      { email: ACCOUNT_MANAGER_EMAIL },
      { email: booking.customerEmail, displayName: booking.customerName },
    ],
    guestsCanModify:       false,
    guestsCanInviteOthers: false,
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'email',  minutes: 24 * 60 },
        { method: 'popup',  minutes: 30 },
      ],
    },
    colorId: '9',
    extendedProperties: {
      private: {
        intelBookingRef:   booking.bookingReference,
        intelCustomerName: booking.customerName,
        intelCompany:      booking.companyName,
        source:            'intel-booking-platform',
      },
    },
  };

  const calId = encodeURIComponent(TRAINING_CALENDAR_ID);
  const data  = await calendarFetch('POST', `/calendars/${calId}/events?sendUpdates=all`, event);

  return { eventId: data.id, eventLink: data.htmlLink };
}

// ─── Update event ─────────────────────────────────────────────────────────────

export async function updateBookingCalendarEvent(eventId, updates) {
  const { TRAINING_CALENDAR_ID } = getEnv();
  const patch = {};
  if (updates.startDateTime) patch.start = { dateTime: updates.startDateTime, timeZone: 'Europe/Amsterdam' };
  if (updates.endDateTime)   patch.end   = { dateTime: updates.endDateTime,   timeZone: 'Europe/Amsterdam' };
  if (updates.location)      patch.location = updates.location;
  if (updates.trainingTitle || updates.companyName) {
    patch.summary = `📋 ${updates.trainingTitle} — ${updates.companyName}`;
  }

  const calId = encodeURIComponent(TRAINING_CALENDAR_ID);
  const data  = await calendarFetch('PATCH', `/calendars/${calId}/events/${eventId}?sendUpdates=all`, patch);
  return { eventId: data.id, eventLink: data.htmlLink };
}

// ─── Cancel event ─────────────────────────────────────────────────────────────

export async function cancelBookingCalendarEvent(eventId) {
  const { TRAINING_CALENDAR_ID } = getEnv();
  const calId = encodeURIComponent(TRAINING_CALENDAR_ID);
  await calendarFetch('DELETE', `/calendars/${calId}/events/${eventId}?sendUpdates=all`);
}

// ─── List upcoming bookings ───────────────────────────────────────────────────

export async function listUpcomingBookings(maxResults = 10) {
  const { TRAINING_CALENDAR_ID } = getEnv();
  const calId    = encodeURIComponent(TRAINING_CALENDAR_ID);
  const timeMin  = encodeURIComponent(new Date().toISOString());
  const data     = await calendarFetch(
    'GET',
    `/calendars/${calId}/events?timeMin=${timeMin}&maxResults=${maxResults}&singleEvents=true&orderBy=startTime&privateExtendedProperty=source%3Dintel-booking-platform`,
  );

  return (data.items || []).map(event => ({
    eventId:      event.id,
    eventLink:    event.htmlLink,
    title:        event.summary,
    start:        event.start?.dateTime || event.start?.date,
    end:          event.end?.dateTime   || event.end?.date,
    location:     event.location,
    bookingRef:   event.extendedProperties?.private?.intelBookingRef,
    customerName: event.extendedProperties?.private?.intelCustomerName,
    company:      event.extendedProperties?.private?.intelCompany,
    status:       event.status,
  }));
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildEventDescription(booking) {
  const BOOKING_BASE_URL = process.env.BOOKING_BASE_URL?.trim() || 'https://intel-booking.web.app';
  return [
    `Intel Training Booking`,
    ``,
    `Referentie:  ${booking.bookingReference}`,
    `Training:    ${booking.trainingTitle}`,
    `Klant:       ${booking.customerName} (${booking.companyName})`,
    `E-mail:      ${booking.customerEmail}`,
    `Locatie:     ${booking.location}`,
    booking.notes ? `\nNotities:\n${booking.notes}` : '',
    ``,
    `Beheer deze boeking: ${BOOKING_BASE_URL}/dashboard`,
  ].join('\n');
}
