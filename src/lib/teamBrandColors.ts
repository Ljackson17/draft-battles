import { TEAM_CODE_MAP } from "./teamLogos";

/** Official-ish primary/secondary brand colors, keyed by the same ESPN slug
 * teamLogos.ts resolves raw team codes to. Used to wash a picked player's
 * card in their real NFL team's colors — independent of the GM jersey
 * color (--team) assigned per drafter column. */
const BRAND_COLORS: Record<string, [primary: string, secondary: string]> = {
  ari: ["#97233F", "#000000"],
  atl: ["#A71930", "#000000"],
  bal: ["#241773", "#9E7C0C"],
  buf: ["#00338D", "#C60C30"],
  car: ["#0085CA", "#101820"],
  chi: ["#0B162A", "#C83803"],
  cin: ["#FB4F14", "#000000"],
  cle: ["#311D00", "#FF3C00"],
  dal: ["#041E42", "#869397"],
  den: ["#FB4F14", "#002244"],
  det: ["#0076B6", "#B0B7BC"],
  gb: ["#203731", "#FFB612"],
  hou: ["#03202F", "#A71930"],
  ind: ["#002C5F", "#A2AAAD"],
  jax: ["#006778", "#D7A22A"],
  kc: ["#E31837", "#FFB81C"],
  lar: ["#003594", "#FFA300"],
  lac: ["#0080C6", "#FFC20E"],
  lv: ["#000000", "#A5ACAF"],
  mia: ["#008E97", "#FC4C02"],
  min: ["#4F2683", "#FFC62F"],
  ne: ["#002244", "#C60C30"],
  no: ["#D3BC8D", "#101820"],
  nyg: ["#0B2265", "#A71930"],
  nyj: ["#125740", "#000000"],
  phi: ["#004C54", "#A5ACAF"],
  pit: ["#FFB612", "#101820"],
  sea: ["#002244", "#69BE28"],
  sf: ["#AA0000", "#B3995D"],
  tb: ["#D50A0A", "#34302B"],
  ten: ["#0C2340", "#4B92DB"],
  wsh: ["#5A1414", "#FFB612"],
};

export function teamCardGradient(rawTeamCode: string): string | null {
  const slug = TEAM_CODE_MAP[rawTeamCode?.trim().toUpperCase()];
  const colors = slug ? BRAND_COLORS[slug] : undefined;
  if (!colors) return null;
  const [primary, secondary] = colors;
  return `linear-gradient(135deg, color-mix(in srgb, ${primary} 30%, var(--surface)) 0%, color-mix(in srgb, ${secondary} 16%, var(--surface)) 100%)`;
}
