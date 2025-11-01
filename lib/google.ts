import { google } from "googleapis";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/nextauth";

export async function getGoogleClient() {
  const session = await getServerSession(authOptions as any);
  if (!session || !session.user) throw new Error("Not authenticated");
  const tokens = (session as any).tokens;
  if (!tokens?.access_token) throw new Error("No Google tokens in session");

  const { client_id, client_secret } = await getGoogleSecrets();
  const oAuth2Client = new google.auth.OAuth2({
    clientId: client_id,
    clientSecret: client_secret,
    redirectUri: process.env.NEXTAUTH_URL ? `${process.env.NEXTAUTH_URL}/api/auth/callback/google` : undefined
  });
  oAuth2Client.setCredentials({
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expiry_date: tokens.expiry_date
  });
  return { oAuth2Client };
}

async function getGoogleSecrets() {
  return {
    client_id: process.env.GOOGLE_CLIENT_ID!,
    client_secret: process.env.GOOGLE_CLIENT_SECRET!
  };
}
