import { setGlobalOptions } from 'firebase-functions';
import { onRequest } from 'firebase-functions/https';
import { logger } from 'firebase-functions/logger';
import {
  createBookingCalendarEvent,
  listUpcomingBookings as listBookings,
} from './google-calendar.js';

setGlobalOptions({ maxInstances: 10 });

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * POST /createBookingEvent
 *
 * Called from confirmed.html after a booking is finalised.
 * Body (JSON): { trainingTitle, customerName, customerEmail, companyName,
 *               startDateTime, endDateTime, location, bookingReference, notes? }
 *
 * Returns: { eventId, eventLink }
 */
export const createBookingEvent = onRequest(async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const {
    trainingTitle, customerName, customerEmail, companyName,
    startDateTime, endDateTime, location, bookingReference, notes,
  } = req.body;

  const required = { trainingTitle, customerName, customerEmail, companyName, startDateTime, endDateTime, location, bookingReference };
  const missing = Object.entries(required).filter(([, v]) => !v).map(([k]) => k);
  if (missing.length) {
    return res.status(400).json({ error: `Missing required fields: ${missing.join(', ')}` });
  }

  if (!EMAIL_RE.test(customerEmail)) {
    return res.status(400).json({ error: 'Invalid customerEmail format' });
  }

  try {
    const result = await createBookingCalendarEvent({
      trainingTitle, customerName, customerEmail, companyName,
      startDateTime, endDateTime, location, bookingReference, notes,
    });

    logger.info('Calendar event created', { bookingReference, eventId: result.eventId });
    return res.status(200).json(result);
  } catch (err) {
    logger.error('Failed to create calendar event', { bookingReference, error: err.message });
    return res.status(500).json({ error: 'Failed to create calendar event' });
  }
});

/**
 * GET /listUpcomingBookings?limit=10
 *
 * Returns upcoming Intel training events for the Admin Dashboard.
 */
export const listUpcomingBookings = onRequest(async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const limit = Math.min(parseInt(req.query.limit, 10) || 10, 50);

  try {
    const bookings = await listBookings(limit);
    return res.status(200).json({ bookings });
  } catch (err) {
    logger.error('Failed to list bookings', { error: err.message });
    return res.status(500).json({ error: 'Failed to list upcoming bookings' });
  }
});
