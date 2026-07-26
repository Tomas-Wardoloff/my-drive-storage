import { google, drive_v3 } from "googleapis";
import { prisma } from "@/lib/prisma";
import { decrypt, encrypt } from "@/lib/crypto";
import { TokenStatus } from "@/generated/prisma/enums";

function createOauthClient(account: {
  id: string;
  accessToken: string;
  refreshToken: string;
  email: string;
  tokenStatus: TokenStatus;
}) {
  const clientId = process.env.GOOGLE_CLIENT_ID!;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET!;
  const redirectUri = `${process.env.APP_URL!}/api/auth/google/callback`;

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);

  oauth2Client.setCredentials({
    access_token: decrypt(account.accessToken),
    refresh_token: decrypt(account.refreshToken),
  });

  return oauth2Client;
}

export async function getDriveClient(accountId: string): Promise<drive_v3.Drive> {
  const account = await prisma.googleAccount.findUnique({
    where: { id: accountId },
    select: {
      id: true,
      email: true,
      accessToken: true,
      refreshToken: true,
      tokenStatus: true,
    },
  });

  if (!account) {
    throw new Error("Account not found");
  }

  if (account.tokenStatus === "TOKEN_EXPIRED" || account.tokenStatus === "REVOKED") {
    throw new Error("Token expired");
  }

  const oauth2Client = createOauthClient(account);

  oauth2Client.on("tokens", async (tokens) => {
    if (tokens.access_token) {
      try {
        await prisma.googleAccount.update({
          where: { id: accountId },
          data: {
            accessToken: encrypt(tokens.access_token),
            tokenStatus: "ACTIVE",
          },
        });
      } catch (err) {
        console.error(
          `[getDriveClient] Error refreshing the access token for ${account.email}:`,
          err,
        );
      }
    }
  });

  return google.drive({ version: "v3", auth: oauth2Client });
}
