export interface GoogleTokens {
  accessToken: string;
  refreshToken: string;
  expiryDate: number | null;
}

export interface GoogleUserInfo {
  email: string;
  displayName: string | null;
  pictureUrl: string | null;
}

export const SCOPES = [
  "https://www.googleapis.com/auth/drive",
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile",
];
