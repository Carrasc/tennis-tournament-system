import type { Metadata } from "next";
import { NewTournamentForm } from "./NewTournamentForm";

export const metadata: Metadata = { title: "New tournament" };

export default function NewTournamentPage() {
  return (
    <div className="max-w-2xl">
      <NewTournamentForm />
    </div>
  );
}
