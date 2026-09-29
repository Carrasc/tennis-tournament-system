import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

// One signed cookie per tournament the visitor has unlocked with the organiser code.
const PREFIX = "organiser_";
const ONE_YEAR = 60 * 60 * 24 * 365;

function secret() {
  const value = process.env.SESSION_SECRET;
  if (!value && process.env.NODE_ENV === "production") {
    throw new Error("SESSION_SECRET must be set in production");
  }
  return value || "dev-only-secret";
}

function sign(tournamentId: string) {
  return createHmac("sha256", secret()).update(tournamentId).digest("hex");
}

export async function grantOrganiser(tournamentId: string) {
  const store = await cookies();
  store.set(PREFIX + tournamentId, sign(tournamentId), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: ONE_YEAR,
    path: "/",
  });
}

export async function revokeOrganiser(tournamentId: string) {
  const store = await cookies();
  store.delete(PREFIX + tournamentId);
}

export async function isOrganiser(tournamentId: string) {
  const store = await cookies();
  const value = store.get(PREFIX + tournamentId)?.value;
  if (!value) return false;
  const expected = Buffer.from(sign(tournamentId));
  const given = Buffer.from(value);
  return given.length === expected.length && timingSafeEqual(given, expected);
}
