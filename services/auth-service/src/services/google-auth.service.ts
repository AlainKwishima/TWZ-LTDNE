import { OAuth2Client } from 'google-auth-library';
import { AuthError } from './auth.errors.js';

export interface GoogleTokenPayload {
  googleId: string;
  email: string;
  fullName: string;
  emailVerified: boolean;
}

let oauthClient: OAuth2Client | null = null;

function getOAuthClient(): OAuth2Client {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    throw new AuthError('Google sign-in is unavailable', 503);
  }
  if (!oauthClient) {
    oauthClient = new OAuth2Client(clientId);
  }
  return oauthClient;
}

export async function verifyGoogleIdToken(credential: string): Promise<GoogleTokenPayload> {
  const client = getOAuthClient();
  let ticket;
  try {
    ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
  } catch {
    throw new AuthError('Invalid Google sign-in token', 401);
  }

  const payload = ticket.getPayload();
  if (!payload?.sub || !payload.email) {
    throw new AuthError('Invalid Google sign-in token', 401);
  }

  if (!payload.email_verified) {
    throw new AuthError('Google account email is not verified', 401);
  }

  return {
    googleId: payload.sub,
    email: payload.email.toLowerCase().trim(),
    fullName: payload.name?.trim() || payload.email.split('@')[0],
    emailVerified: true,
  };
}
