import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeForTokens, getUserInfo } from "@/lib/google-oauth";
import { encrypt } from "@/lib/crypto";
import { prisma } from "@/lib/prisma";

const APP_URL = process.env.APP_URL!;

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = request.nextUrl;

  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error) {
    console.warn(`Google oauth error: ${error}`);
    return NextResponse.redirect(`${APP_URL}?error=oauth_denied`);
  }

  if (!code || !state) {
    return NextResponse.redirect(`${APP_URL}?error=missing_params`);
  }

  const cookieState = request.cookies.get("oauth_state")?.value;
  if (!cookieState || cookieState !== state) {
    console.warn("Invalid state. Possible CSRF attack or expired session.");
    return NextResponse.redirect(`${APP_URL}?error=invalid_state`);
  }

  try {
    const tokens = await exchangeCodeForTokens(code);
    const userInfo = await getUserInfo(tokens.accessToken);

    const encryptedAccessToken = encrypt(tokens.accessToken);
    const encryptedRefreshToken = encrypt(tokens.refreshToken);

    await prisma.googleAccount.upsert({
      where: { email: userInfo.email },
      create: {
        email: userInfo.email,
        displayName: userInfo.displayName,
        pictureUrl: userInfo.pictureUrl,
        accessToken: encryptedAccessToken,
        refreshToken: encryptedRefreshToken,
        tokenStatus: "ACTIVE",
      },
      update: {
        displayName: userInfo.displayName,
        pictureUrl: userInfo.pictureUrl,
        accessToken: encryptedAccessToken,
        refreshToken: encryptedRefreshToken,
        tokenStatus: "ACTIVE",
      },
    });

    const response = NextResponse.redirect(`${APP_URL}`);
    response.cookies.delete("oauth_state");
    return response;
  } catch (err) {
    console.error("Google oauth error:", err);
    return NextResponse.redirect(`${APP_URL}?error=oauth_failed`);
  }
}
