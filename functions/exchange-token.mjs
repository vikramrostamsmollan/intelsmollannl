// Run after get-auth-url.mjs — exchanges the OAuth code for a refresh token
// Usage: node exchange-token.mjs <code>

import { google } from 'googleapis';
import 'dotenv/config';

const code = process.argv[2];
if (!code) {
  console.error('Usage: node exchange-token.mjs <code>');
  process.exit(1);
}

const client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

const { tokens } = await client.getToken(code);
console.log('\nSave this refresh token to functions/.env as GOOGLE_REFRESH_TOKEN:\n');
console.log(tokens.refresh_token);
// Full token response intentionally not logged to avoid leaking access_token/refresh_token in CI logs
