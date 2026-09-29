import "server-only";
import { apiTennis } from "./api-tennis";
import { demoSource } from "./demo";
import type { ProSource } from "./types";

/** Live data when API_TENNIS_KEY is set, otherwise sample draws. */
export function proSource(): ProSource {
  return process.env.API_TENNIS_KEY ? apiTennis : demoSource;
}

export type { ProDraw, ProSummary } from "./types";
