/**
 * Intel Booking — Google Calendar Integration
 *
 * Triggers when a customer confirms a booking. Creates a Google Calendar
 * event on the account manager's calendar and sends an invite to both
 * the account manager and the customer.
 *
 * Prerequisites:
 *   1. Google Cloud project with Calendar API enabled
 *   2. OAuth 2.0 credentials (Web Application type)
 *   3. Account manager must have authorised the app once via /auth/google
 *   4. Store the refresh token securely (env: GOOGLE_REFRESH_TOKEN)
 *
 * npm install googleapis
 */

import { google } from 'googleapis';

// ─── Configuration ────────────────────────────────────────────────────────────

const ACCOUNT_MANAGER_EMAIL  = process.env.ACCOUNT_MANAGER_EMAIL;
const GOOGLE_CLIENT_ID       = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET   = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REFRESH_TOKEN   = process.env.GOOGLE_REFRESH_TOKEN;

// Fail fast on missing required env vars — better than a cryptic Google API error at call time
const REQUIRED_ENV = { ACCOUNT_MANAGER_EMAIL, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN };
for (const [key, val] of Object.entries(REQUIRED_ENV)) {
  if (!val) throw new Error(`Missing required environment variable: ${key}`);
}
const REDIRECT_URI           = process.env.GOOGLE_REDIRECT_URI      || 'http://localhost:3000/auth/google/callback';
const BOOKING_BASE_URL       = process.env.BOOKING_BASE_URL         || 'https://intel-booking.web.app';
const TRAINING_CALENDAR_ID   = process.env.TRAINING_CALENDAR_ID     || 'primary'; // set after createCalendar() is run once

// ─── Auth ─────────────────────────────────────────────────────────────────────

function createOAuthClient() {
  const client = new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    REDIRECT_URI
  );
  client.setCredentials({ refresh_token: GOOGLE_REFRESH_TOKEN });
  return client;
}

// ─── Core: Create calendar event from booking ─────────────────────────────────

/**
 * @param {Object} booking
 * @param {string} booking.trainingTitle      - e.g. "Intel Core Ultra Architecture Deep Dive"
 * @param {string} booking.customerName       - e.g. "Jan de Vries"
 * @param {string} booking.customerEmail      - e.g. "jan@retailer.nl"
 * @param {string} booking.companyName        - e.g. "MediaMarkt Amsterdam"
 * @param {string} booking.startDateTime      - ISO 8601, e.g. "2026-03-18T09:00:00+01:00"
 * @param {string} booking.endDateTime        - ISO 8601, e.g. "2026-03-18T17:00:00+01:00"
 * @param {string} booking.location           - e.g. "Intel Experience Center Amsterdam"
 * @param {string} booking.bookingReference   - e.g. "INT-2026-8472"
 * @param {string} [booking.notes]            - Optional extra notes
 * @returns {Promise<{eventId: string, eventLink: string}>}
 */
export async function createBookingCalendarEvent(booking) {
  const auth     = createOAuthClient();
  const calendar = google.calendar({ version: 'v3', auth });

  const event = {
    summary: `📋 ${booking.trainingTitle} — ${booking.companyName}`,
    location: booking.location,
    description: buildEventDescription(booking),

    start: {
      dateTime: booking.startDateTime,
      timeZone: 'Europe/Amsterdam',
    },
    end: {
      dateTime: booking.endDateTime,
      timeZone: 'Europe/Amsterdam',
    },

    // Invite both account manager and customer
    attendees: [
      { email: ACCOUNT_MANAGER_EMAIL },
      { email: booking.customerEmail, displayName: booking.customerName },
    ],

    // Send email invites automatically
    guestsCanModify: false,
    guestsCanInviteOthers: false,

    // Reminder: 1 day before + 30 min before
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'email', minutes: 24 * 60 },
        { method: 'popup', minutes: 30 },
      ],
    },

    // Colour: "Blueberry" for Intel trainings
    colorId: '9',

    // Custom metadata for programmatic lookup
    extendedProperties: {
      private: {
        intelBookingRef:   booking.bookingReference,
        intelCustomerName: booking.customerName,
        intelCompany:      booking.companyName,
        source:            'intel-booking-platform',
      },
    },
  };

  const response = await calendar.events.insert({
    calendarId:          TRAINING_CALENDAR_ID,
    resource:            event,
    sendUpdates:         'all',        // sends invite emails to attendees
    conferenceDataVersion: 0,
  });

  return {
    eventId:   response.data.id,
    eventLink: response.data.htmlLink,
  };
}

// ─── Update event (e.g. rescheduled booking) ──────────────────────────────────

/**
 * @param {string} eventId     - The Google Calendar event ID to update
 * @param {Object} updates     - Partial booking fields to update (same shape as createBookingCalendarEvent)
 */
export async function updateBookingCalendarEvent(eventId, updates) {
  const auth     = createOAuthClient();
  const calendar = google.calendar({ version: 'v3', auth });

  const patch = {};

  if (updates.startDateTime) patch.start = { dateTime: updates.startDateTime, timeZone: 'Europe/Amsterdam' };
  if (updates.endDateTime)   patch.end   = { dateTime: updates.endDateTime,   timeZone: 'Europe/Amsterdam' };
  if (updates.location)      patch.location = updates.location;
  if (updates.trainingTitle || updates.companyName) {
    patch.summary = `📋 ${updates.trainingTitle} — ${updates.companyName}`;
  }

  const response = await calendar.events.patch({
    calendarId:  TRAINING_CALENDAR_ID,
    eventId,
    resource:    patch,
    sendUpdates: 'all',
  });

  return { eventId: response.data.id, eventLink: response.data.htmlLink };
}

// ─── Cancel event (booking cancelled) ─────────────────────────────────────────

/**
 * @param {string} eventId - The Google Calendar event ID to delete
 */
export async function cancelBookingCalendarEvent(eventId) {
  const auth     = createOAuthClient();
  const calendar = google.calendar({ version: 'v3', auth });

  await calendar.events.delete({
    calendarId:  TRAINING_CALENDAR_ID,
    eventId,
    sendUpdates: 'all',
  });
}

// ─── List upcoming bookings from calendar (for Admin Dashboard) ───────────────

/**
 * Returns upcoming Intel training events from the account manager's calendar.
 * @param {number} [maxResults=10]
 * @returns {Promise<Array>}
 */
export async function listUpcomingBookings(maxResults = 10) {
  const auth     = createOAuthClient();
  const calendar = google.calendar({ version: 'v3', auth });

  const response = await calendar.events.list({
    calendarId:   TRAINING_CALENDAR_ID,
    timeMin:      new Date().toISOString(),
    maxResults,
    singleEvents: true,
    orderBy:      'startTime',
    // Filter to only Intel booking events
    privateExtendedProperty: 'source=intel-booking-platform',
  });

  return (response.data.items || []).map(event => ({
    eventId:        event.id,
    eventLink:      event.htmlLink,
    title:          event.summary,
    start:          event.start?.dateTime || event.start?.date,
    end:            event.end?.dateTime   || event.end?.date,
    location:       event.location,
    bookingRef:     event.extendedProperties?.private?.intelBookingRef,
    customerName:   event.extendedProperties?.private?.intelCustomerName,
    company:        event.extendedProperties?.private?.intelCompany,
    status:         event.status,
  }));
}

// ─── Create dedicated calendar (run once during setup) ────────────────────────

/**
 * Creates a new Google Calendar and returns its ID.
 * Run once during Milestone 1 setup, then store the returned ID as TRAINING_CALENDAR_ID.
 * @param {string} [name='Intel Training NL']
 * @returns {Promise<{id: string, summary: string}>}
 */
export async function createCalendar(name = 'Intel Training NL') {
  const auth     = createOAuthClient();
  const calendar = google.calendar({ version: 'v3', auth });

  const response = await calendar.calendars.insert({
    resource: {
      summary:  name,
      timeZone: 'Europe/Amsterdam',
    },
  });

  console.log('Calendar created. Store this as TRAINING_CALENDAR_ID:', response.data.id);
  return { id: response.data.id, summary: response.data.summary };
}

// ─── OAuth setup (run once to get refresh token) ──────────────────────────────

/**
 * Step 1: Generate the authorisation URL and open it in a browser.
 * The account manager logs in and grants access.
 */
export function getAuthUrl() {
  const client = new google.auth.OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, REDIRECT_URI);
  return client.generateAuthUrl({
    access_type: 'offline',
    scope:       ['https://www.googleapis.com/auth/calendar.events'],
    prompt:      'consent',
  });
}

/**
 * Step 2: Exchange the code from the callback URL for tokens.
 * Save `tokens.refresh_token` to env as GOOGLE_REFRESH_TOKEN.
 * @param {string} code - The code parameter from the OAuth callback URL
 */
export async function exchangeCodeForTokens(code) {
  const client = new google.auth.OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, REDIRECT_URI);
  const { tokens } = await client.getToken(code);
  console.log('Refresh token (save to env):', tokens.refresh_token);
  return tokens;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildEventDescription(booking) {
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
