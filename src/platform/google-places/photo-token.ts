import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

const TOKEN_LIFETIME_SECONDS = 300;
const PHOTO_NAME_PATTERN = /^places\/[A-Za-z0-9_-]+\/photos\/[A-Za-z0-9_-]+$/;

export type GooglePhotoTokenPayload = Readonly<{
  expires: number;
  maxWidth: number;
  photoName: string;
}>;

function signature(payload: string, secret: string) {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

function normalizedWidth(value: number) {
  return Math.min(1600, Math.max(96, Math.round(value)));
}

export function createGooglePhotoToken(
  photoName: string,
  maxWidth: number,
  secret: string,
  now = Date.now(),
) {
  if (!PHOTO_NAME_PATTERN.test(photoName)) {
    throw new Error("Invalid Google photo resource name.");
  }
  const payload: GooglePhotoTokenPayload = {
    expires: Math.floor(now / 1000) + TOKEN_LIFETIME_SECONDS,
    maxWidth: normalizedWidth(maxWidth),
    photoName,
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${encoded}.${signature(encoded, secret)}`;
}

export function verifyGooglePhotoToken(
  token: string,
  secret: string,
  now = Date.now(),
): GooglePhotoTokenPayload | null {
  const [encoded, suppliedSignature, extra] = token.split(".");
  if (!encoded || !suppliedSignature || extra) return null;
  const expectedSignature = signature(encoded, secret);
  const supplied = Buffer.from(suppliedSignature);
  const expected = Buffer.from(expectedSignature);
  if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) return null;

  try {
    const value = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as Record<
      string,
      unknown
    >;
    if (
      typeof value.expires !== "number" ||
      value.expires < Math.floor(now / 1000) ||
      typeof value.maxWidth !== "number" ||
      value.maxWidth !== normalizedWidth(value.maxWidth) ||
      typeof value.photoName !== "string" ||
      !PHOTO_NAME_PATTERN.test(value.photoName)
    ) {
      return null;
    }
    return {
      expires: value.expires,
      maxWidth: value.maxWidth,
      photoName: value.photoName,
    };
  } catch {
    return null;
  }
}
