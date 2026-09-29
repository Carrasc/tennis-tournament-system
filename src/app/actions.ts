"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { hashEditCode, newEditCode, newPublicCode, normalizeCode } from "@/lib/codes";
import { grantOrganiser, isOrganiser, revokeOrganiser } from "@/lib/session";
import { makeDraw, nextPowerOfTwo, winnerFromSets } from "@/lib/bracket";
import type { SetScore } from "@/lib/types";
import { entryWord } from "@/lib/names";

export type FormState = { error?: string; ok?: string } | undefined;
export type CreateState =
  | { error?: string; created?: { publicCode: string; editCode: string; name: string } }
  | undefined;

const MAX_PLAYERS = 128;

function text(form: FormData, key: string) {
  return String(form.get(key) ?? "").trim();
}

type Entry = { name: string; partner: string | null };

function kindOf(form: FormData) {
  return text(form, "kind") === "doubles" ? "doubles" : "singles";
}

/**
 * One entry per line. In doubles a line is a team: "Maria Lopez / Joan Walsh" (or "&").
 * Returns the entries, or an error naming the first line that is missing a partner.
 */
function parseEntries(raw: string, kind: string): { entries: Entry[] } | { error: string } {
  const lines = raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (kind !== "doubles") return { entries: lines.map((name) => ({ name, partner: null })) };

  const entries: Entry[] = [];
  for (const [i, line] of lines.entries()) {
    const [name, partner] = line.split(/\s*[/&]\s*/).map((part) => part.trim());
    if (!name || !partner) {
      return { error: `Line ${i + 1} (“${line}”) needs two names, like “Maria Lopez / Joan Walsh”.` };
    }
    entries.push({ name, partner });
  }
  return { entries };
}


/** Loads the tournament and makes sure this visitor unlocked it with the organiser code. */
async function forOrganiser(tournamentId: string) {
  const t = await db.tournament.findUnique({ where: { id: tournamentId } });
  if (!t || !(await isOrganiser(t.id))) {
    throw new Error("You need the organiser code to change this tournament.");
  }
  return t;
}

function refresh(publicCode: string) {
  revalidatePath(`/t/${publicCode}`, "layout");
}

// ---------- Creating and opening ----------

export async function createTournament(_: CreateState, form: FormData): Promise<CreateState> {
  const name = text(form, "name");
  if (!name) return { error: "Give the tournament a name." };
  const kind = kindOf(form);
  const parsed = parseEntries(text(form, "players"), kind);
  if ("error" in parsed) return parsed;
  if (parsed.entries.length > MAX_PLAYERS) return { error: `A draw can have at most ${MAX_PLAYERS} ${entryWord(kind, 2)}.` };

  const startDate = text(form, "startDate");
  const editCode = newEditCode();

  // Retry on the (very unlikely) chance a generated code is already taken.
  for (let attempt = 0; attempt < 5; attempt++) {
    const publicCode = newPublicCode();
    try {
      const t = await db.tournament.create({
        data: {
          name,
          location: text(form, "location") || null,
          startDate: startDate ? new Date(startDate) : null,
          setsToWin: text(form, "format") === "5" ? 3 : 2,
          kind,
          publicCode,
          editCodeHash: hashEditCode(editCode),
          participants: { create: parsed.entries },
        },
      });
      await grantOrganiser(t.id);
      return { created: { publicCode, editCode, name } };
    } catch (e) {
      if (attempt === 4) throw e;
    }
  }
}

/** One box for both codes: the 6-letter code opens the draw, the organiser code opens editing. */
export async function openWithCode(_: FormState, form: FormData): Promise<FormState> {
  const code = normalizeCode(text(form, "code"));
  if (!code) return { error: "Type the code you were given." };

  const byEditCode = await db.tournament.findUnique({ where: { editCodeHash: hashEditCode(code) } });
  if (byEditCode) {
    await grantOrganiser(byEditCode.id);
    redirect(`/t/${byEditCode.publicCode}/manage`);
  }

  const byPublicCode = await db.tournament.findUnique({ where: { publicCode: code } });
  if (byPublicCode) redirect(`/t/${byPublicCode.publicCode}`);

  return { error: "No tournament uses that code. Check the letters and try again." };
}

export async function signOut(tournamentId: string) {
  const t = await db.tournament.findUnique({ where: { id: tournamentId } });
  await revokeOrganiser(tournamentId);
  redirect(t ? `/t/${t.publicCode}` : "/");
}

// ---------- Details and players ----------

export async function updateDetails(tournamentId: string, _: FormState, form: FormData): Promise<FormState> {
  const t = await forOrganiser(tournamentId);
  const name = text(form, "name");
  if (!name) return { error: "The tournament needs a name." };
  const startDate = text(form, "startDate");
  await db.tournament.update({
    where: { id: t.id },
    data: {
      name,
      location: text(form, "location") || null,
      startDate: startDate ? new Date(startDate) : null,
      setsToWin: text(form, "format") === "5" ? 3 : 2,
      // Singles or doubles can only change before the draw is made.
      ...(t.status === "setup" && form.has("kind") ? { kind: kindOf(form) } : {}),
    },
  });
  // Back to singles: drop the partners so every entry is one player again.
  if (t.status === "setup" && form.has("kind") && kindOf(form) === "singles" && t.kind === "doubles") {
    await db.participant.updateMany({ where: { tournamentId: t.id }, data: { partner: null } });
  }
  refresh(t.publicCode);
  return { ok: "Details saved." };
}

export async function addPlayers(tournamentId: string, _: FormState, form: FormData): Promise<FormState> {
  const t = await forOrganiser(tournamentId);
  if (t.status !== "setup") return { error: "The draw is already made. Redo the draw to add players." };
  const parsed = parseEntries(text(form, "players"), t.kind);
  if ("error" in parsed) return parsed;
  const { entries } = parsed;
  if (!entries.length) return { error: t.kind === "doubles" ? "Write at least one team." : "Write at least one name." };
  const count = await db.participant.count({ where: { tournamentId: t.id } });
  if (count + entries.length > MAX_PLAYERS) {
    return { error: `A draw can have at most ${MAX_PLAYERS} ${entryWord(t.kind, 2)}.` };
  }
  await db.participant.createMany({ data: entries.map((e) => ({ ...e, tournamentId: t.id })) });
  refresh(t.publicCode);
  return { ok: `${entries.length} ${entryWord(t.kind, entries.length)} added.` };
}

export async function removePlayer(tournamentId: string, participantId: string) {
  const t = await forOrganiser(tournamentId);
  if (t.status !== "setup") return;
  await db.participant.deleteMany({ where: { id: participantId, tournamentId: t.id } });
  refresh(t.publicCode);
}

export async function setSeed(tournamentId: string, participantId: string, form: FormData) {
  const t = await forOrganiser(tournamentId);
  if (t.status !== "setup") return;
  const raw = text(form, "seed");
  const seed = raw ? Number(raw) : null;
  // A seed number belongs to one player: taking it moves it off anyone else.
  await db.$transaction([
    ...(seed ? [db.participant.updateMany({ where: { tournamentId: t.id, seed }, data: { seed: null } })] : []),
    db.participant.updateMany({ where: { id: participantId, tournamentId: t.id }, data: { seed } }),
  ]);
  refresh(t.publicCode);
}

// ---------- The draw ----------

export async function createDraw(tournamentId: string, _: FormState): Promise<FormState> {
  const t = await forOrganiser(tournamentId);
  const played = await db.match.count({ where: { tournamentId: t.id, outcome: { not: "bye" }, status: "finished" } });
  if (played) return { error: "Results have been entered, so the draw can no longer change." };

  const players = await db.participant.findMany({ where: { tournamentId: t.id } });
  if (players.length < 2) return { error: `Add at least 2 ${entryWord(t.kind, 2)} to make a draw.` };
  const alone = t.kind === "doubles" ? players.find((p) => !p.partner) : undefined;
  if (alone) {
    return { error: `${alone.name} has no partner yet. Remove them and add the team again as “Name / Partner”.` };
  }

  const slots = makeDraw(players);
  const size = nextPowerOfTwo(players.length);
  const rounds = Math.log2(size);

  type NewMatch = {
    round: number;
    position: number;
    player1Id: string | null;
    player2Id: string | null;
    winnerId: string | null;
    status: string;
    outcome: string;
  };
  const byRound: NewMatch[][] = [];
  for (let r = 1; r <= rounds; r++) {
    const count = size / 2 ** r;
    byRound.push(
      Array.from({ length: count }, (_, position) => ({
        round: r,
        position,
        player1Id: r === 1 ? slots[position * 2] : null,
        player2Id: r === 1 ? slots[position * 2 + 1] : null,
        winnerId: null,
        status: "pending",
        outcome: "normal",
      })),
    );
  }

  // Players facing a bye go straight through to round 2.
  for (const m of byRound[0]) {
    if (m.player1Id && m.player2Id) continue;
    const through = m.player1Id ?? m.player2Id;
    Object.assign(m, { winnerId: through, status: "finished", outcome: "bye" });
    const next = byRound[1]?.[Math.floor(m.position / 2)];
    if (next) next[slotFor(m.position)] = through;
  }

  await db.$transaction([
    db.match.deleteMany({ where: { tournamentId: t.id } }),
    db.match.createMany({ data: byRound.flat().map((m) => ({ ...m, tournamentId: t.id })) }),
    db.tournament.update({ where: { id: t.id }, data: { status: "in_progress" } }),
  ]);
  refresh(t.publicCode);
  return { ok: "The draw is made." };
}

export async function undoDraw(tournamentId: string) {
  const t = await forOrganiser(tournamentId);
  const played = await db.match.count({ where: { tournamentId: t.id, outcome: { not: "bye" }, status: "finished" } });
  if (played) return;
  await db.$transaction([
    db.match.deleteMany({ where: { tournamentId: t.id } }),
    db.tournament.update({ where: { id: t.id }, data: { status: "setup" } }),
  ]);
  refresh(t.publicCode);
}

// ---------- Matches ----------

/** Winners of even positions fill the top line of the next match, odd positions the bottom line. */
function slotFor(position: number) {
  return position % 2 === 0 ? "player1Id" : "player2Id";
}

function readSets(form: FormData, setsToWin: number): SetScore[] {
  const sets: SetScore[] = [];
  for (let i = 0; i < setsToWin * 2 - 1; i++) {
    const a = text(form, `a${i}`);
    const b = text(form, `b${i}`);
    if (a === "" && b === "") continue;
    const tb = text(form, `tb${i}`);
    sets.push({ a: Number(a) || 0, b: Number(b) || 0, tb: tb === "" ? null : Number(tb) || 0 });
  }
  return sets;
}

export async function saveMatch(tournamentId: string, matchId: string, _: FormState, form: FormData): Promise<FormState> {
  const t = await forOrganiser(tournamentId);
  const match = await db.match.findFirst({ where: { id: matchId, tournamentId: t.id } });
  if (!match) return { error: "That match no longer exists." };
  if (!match.player1Id || !match.player2Id) return { error: "Both players must be known before this match can be played." };
  if (match.status === "finished") return { error: "This match is finished. Use “Clear result” to change it." };

  const status = text(form, "status");
  const note = text(form, "note") || null;
  const sets = readSets(form, t.setsToWin);
  const score = sets.length ? JSON.stringify(sets) : null;

  if (status !== "finished") {
    await db.match.update({
      where: { id: match.id },
      data: { status: status === "live" ? "live" : "pending", court: note, score },
    });
    refresh(t.publicCode);
    return { ok: "Saved." };
  }

  const outcome = ["walkover", "retired"].includes(text(form, "outcome")) ? text(form, "outcome") : "normal";
  const picked = text(form, "winner");
  const fromScore = winnerFromSets(sets, t.setsToWin);
  const winnerSide = picked === "0" || picked === "1" ? (Number(picked) as 0 | 1) : fromScore;

  if (outcome === "normal" && fromScore == null) {
    return { error: `The score doesn’t show a winner yet. A player needs ${t.setsToWin} sets to win.` };
  }
  if (outcome === "normal" && picked !== "" && Number(picked) !== fromScore) {
    return { error: "The winner you picked doesn’t match the score. Check the sets." };
  }
  if (winnerSide == null) return { error: "Choose who won." };

  const winnerId = winnerSide === 0 ? match.player1Id : match.player2Id;
  const next = await db.match.findUnique({
    where: { tournamentId_round_position: { tournamentId: t.id, round: match.round + 1, position: Math.floor(match.position / 2) } },
  });

  await db.$transaction(async (tx) => {
    await tx.match.update({
      where: { id: match.id },
      data: { status: "finished", outcome, winnerId, score, court: note },
    });
    if (next) {
      await tx.match.update({ where: { id: next.id }, data: { [slotFor(match.position)]: winnerId } });
    } else {
      await tx.tournament.update({ where: { id: t.id }, data: { status: "finished" } });
    }
  });
  refresh(t.publicCode);
  return { ok: "Result saved." };
}

export async function clearResult(tournamentId: string, matchId: string, _: FormState): Promise<FormState> {
  const t = await forOrganiser(tournamentId);
  const match = await db.match.findFirst({ where: { id: matchId, tournamentId: t.id } });
  if (!match || match.status !== "finished" || match.outcome === "bye") return { error: "There is no result to clear." };

  const next = await db.match.findUnique({
    where: { tournamentId_round_position: { tournamentId: t.id, round: match.round + 1, position: Math.floor(match.position / 2) } },
  });
  if (next && next.status !== "pending") {
    return { error: "The next match has already started. Clear that one first." };
  }

  await db.$transaction(async (tx) => {
    await tx.match.update({
      where: { id: match.id },
      data: { status: "pending", outcome: "normal", winnerId: null, score: null },
    });
    if (next) {
      await tx.match.update({ where: { id: next.id }, data: { [slotFor(match.position)]: null } });
    } else {
      await tx.tournament.update({ where: { id: t.id }, data: { status: "in_progress" } });
    }
  });
  refresh(t.publicCode);
  return { ok: "Result cleared." };
}
