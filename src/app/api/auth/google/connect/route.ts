import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { getAuthUrl } from "@/lib/google-oauth";

export async function GET(): Promise<NextResponse> {
  const state = randomBytes(32).toString("hex");
  const authUrl = getAuthUrl(state);

  const response = NextResponse.redirect(authUrl);

  response.cookies.set("oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 10,
    secure: process.env.NODE_ENV === "production",
  });

  return response;
}
