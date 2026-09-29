import "server-only";
import { createHash, randomInt } from "node:crypto";

// No 0/O, 1/I/L: easy to read aloud and to copy from paper.
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

function randomCode(length: number) {
  let out = "";
  for (let i = 0; i < length; i++) out += ALPHABET[randomInt(ALPHABET.length)];
  return out;
}

/** 6 characters, shared with spectators. */
export function newPublicCode() {
  return randomCode(6);
}

/** 8 characters shown as ABCD-EFGH, kept by the organiser. */
export function newEditCode() {
  const raw = randomCode(8);
  return `${raw.slice(0, 4)}-${raw.slice(4)}`;
}

/** Uppercases and strips spaces/dashes so "abcd efgh" and "ABCD-EFGH" match. */
export function normalizeCode(input: string) {
  return input.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export function hashEditCode(code: string) {
  return createHash("sha256").update(`tennis-draw:${normalizeCode(code)}`).digest("hex");
}
