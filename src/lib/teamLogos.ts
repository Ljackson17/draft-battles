/**
 * Maps the many raw team codes across our two data sources (nflverse for
 * 1999+, Pro-Football-Reference-style codes from Kaggle for 1970-1998) to a
 * current NFL franchise's ESPN logo code. Franchises that relocated/renamed
 * (Rams, Raiders, Chargers, Washington) show their present-day mark for all
 * historical seasons — era-accurate throwback logos aren't available here.
 *
 * A few codes were reused by two different franchises across our 1970-2025
 * range with a gap between them (BAL: Colts pre-1984 vs. Ravens 1996+; HOU:
 * Oilers pre-1997 vs. Texans 2002+; STL: Cardinals pre-1988 vs. Rams
 * 1995-2015). We can't disambiguate by code alone, so these default to the
 * more recent franchise — the older team may show the wrong logo.
 */
export const TEAM_CODE_MAP: Record<string, string> = {
  ARI: "ari",
  ATL: "atl",
  BAL: "bal",
  BOS: "ne",
  BUF: "buf",
  CAR: "car",
  CHI: "chi",
  CIN: "cin",
  CLE: "cle",
  DAL: "dal",
  DEN: "den",
  DET: "det",
  GB: "gb",
  GNB: "gb",
  HOU: "hou",
  IND: "ind",
  JAC: "jax",
  JAX: "jax",
  KAN: "kc",
  KC: "kc",
  LA: "lar",
  LAC: "lac",
  LV: "lv",
  MIA: "mia",
  MIN: "min",
  NE: "ne",
  NO: "no",
  NOR: "no",
  NWE: "ne",
  NYG: "nyg",
  NYJ: "nyj",
  OAK: "lv",
  PHI: "phi",
  PHO: "ari",
  PIT: "pit",
  RAI: "lv",
  RAM: "lar",
  SD: "lac",
  SDG: "lac",
  SEA: "sea",
  SF: "sf",
  SFO: "sf",
  STL: "lar",
  TAM: "tb",
  TB: "tb",
  TEN: "ten",
  WAS: "wsh",
};

export function teamLogoUrl(rawTeamCode: string): string | null {
  const code = TEAM_CODE_MAP[rawTeamCode?.trim().toUpperCase()];
  if (!code) return null;
  return `https://a.espncdn.com/i/teamlogos/nfl/500/${code}.png`;
}
