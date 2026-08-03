const TEAM_CLASSES = ["team-0", "team-1", "team-2", "team-3", "team-4"];

export function teamClass(index: number): string {
  return TEAM_CLASSES[index % TEAM_CLASSES.length];
}
