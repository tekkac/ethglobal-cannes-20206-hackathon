import { notFound } from "next/navigation";

import { LiveMatchView } from "@/components/match/live-match-view";
import { getMatchDetail } from "@/lib/services/matches";

type Params = Promise<{ id: string }>;

export default async function MatchPage({ params }: { params: Params }) {
  const { id } = await params;
  const match = await getMatchDetail(id);

  if (!match) {
    notFound();
  }

  return <LiveMatchView matchId={id} initialMatch={match} />;
}
