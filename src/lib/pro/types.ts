import type { ViewRound } from "../types";

export type Tour = "ATP" | "WTA";
export type ProEvent = "singles" | "doubles";

export type ProSummary = {
  id: string;
  name: string;
  tour: Tour;
  event: ProEvent;
  liveCount: number;
  currentRound: string | null;
  firstDay: string; // YYYY-MM-DD
  lastDay: string;
};

export type ProDraw = ProSummary & { rounds: ViewRound[] };

export type ProSource = {
  demo: boolean;
  list(): Promise<ProSummary[]>;
  draw(id: string): Promise<ProDraw | null>;
};
