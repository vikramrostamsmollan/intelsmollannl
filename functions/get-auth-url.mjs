// Run once to get the OAuth refresh token
// Usage: node get-auth-url.mjs
// Then visit the URL, authorize, copy the ?code= param, and run exchange-token.mjs

import { google } from 'googleapis';
import 'dotenv/config';

const client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

const url = client.generateAuthUrl({
  access_type: 'offline',
  scope: [
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/calendar.events',
  ],
  prompt: 'consent',
});

console.log('\nVisit this URL to authorize:\n');
console.log(url);
console.log('\nAfter authorizing, copy the "code" parameter from the redirect URL.');
console.log('Then run: node exchange-token.mjs <code>\n');
