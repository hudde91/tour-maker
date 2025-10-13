export function getMatchStatus(
  match: any,
  totalHoles: number = 18
): {
  text: string;
  code: "not-started" | "in-progress" | "dormie" | "complete";
} {
  if (match?.statusText) {
    return {
      text: match.statusText,
      code: (match.statusCode ?? "in-progress") as any,
    };
  }

  const holes = (match?.holes ?? []) as any[];

  const isValid = (n: any) =>
    typeof n === "number" && Number.isFinite(n) && n > 0;

  let aWins = 0;
  let bWins = 0;
  let played = 0;

  for (const h of holes) {
    const a = h?.teamAScore;
    const b = h?.teamBScore;
    const playedHole = isValid(a) && isValid(b);
    if (!playedHole) continue;

    played++;
    const res = a === b ? "tie" : a < b ? "team-a" : "team-b";
    if (res === "team-a") aWins++;
    else if (res === "team-b") bWins++;
  }

  const lead = aWins - bWins;
  const remaining = totalHoles - played;
  const absLead = Math.abs(lead);
  const currentPhrase = (lv: number) =>
    lv === 0 ? "All square" : lv > 0 ? `Team A ${lv} up` : `Team B ${-lv} up`;

  if (played === 0) return { text: "Not started", code: "not-started" };
  if (absLead > remaining)
    return {
      text: `${lead > 0 ? "Team A" : "Team B"} wins ${absLead}&${remaining}`,
      code: "complete",
    };
  if (remaining === 0)
    return {
      text:
        lead === 0 ? "Halved" : `${lead > 0 ? "Team A" : "Team B"} wins 1 up`,
      code: "complete",
    };
  if (absLead === remaining && lead !== 0)
    return { text: `Dormie — ${currentPhrase(lead)}`, code: "dormie" };
  return { text: currentPhrase(lead), code: "in-progress" };
}
