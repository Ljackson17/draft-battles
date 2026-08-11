#!/usr/bin/env python3
"""
Maps player names in src/data/players.json to Sleeper player IDs, so the UI
can show headshots via https://sleepercdn.com/content/nfl/players/<id>.jpg.

Sleeper's /players/nfl dump only covers players active since roughly the
2000s, so most 20th-century seasons in players.json won't match — that's
expected, not a bug. Unmatched names are simply absent from the output map.

Sleeper also has player_id records (with no image) for plenty of retired
players who predate their photo coverage (e.g. LaDainian Tomlinson, Ray
Rice) — their CDN returns 403 for those ids. Every candidate match is
HEAD-checked against the CDN before being kept, so the output only ever
contains ids that actually resolve to an image.

Source: https://api.sleeper.app/v1/players/nfl (no auth required)
"""
import json
import re
import subprocess
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

SLEEPER_URL = "https://api.sleeper.app/v1/players/nfl"
AVATAR_URL = "https://sleepercdn.com/content/nfl/players/thumb/{}.jpg"
PLAYERS_PATH = Path(__file__).parent.parent / "src" / "data" / "players.json"
OUT_PATH = Path(__file__).parent.parent / "src" / "data" / "sleeperAvatars.json"
SKILL_POSITIONS = {"QB", "RB", "WR", "TE"}

SUFFIXES = re.compile(r"\b(jr|sr|ii|iii|iv|v)\b\.?")
NON_ALNUM = re.compile(r"[^a-z0-9]")


def normalize(name: str) -> str:
    name = name.lower()
    name = SUFFIXES.sub("", name)
    return NON_ALNUM.sub("", name)


def has_avatar(player_id: str) -> bool:
    code = subprocess.run(
        ["curl", "-s", "-o", "/dev/null", "-w", "%{http_code}", "--head",
         AVATAR_URL.format(player_id)],
        capture_output=True,
        text=True,
    ).stdout
    return code == "200"


def main():
    print("Fetching Sleeper player dump...")
    raw = subprocess.run(
        ["curl", "-sf", SLEEPER_URL], capture_output=True, check=True
    ).stdout
    sleeper_players = json.loads(raw)

    by_norm_name: dict[str, list[dict]] = {}
    for p in sleeper_players.values():
        if p.get("position") not in SKILL_POSITIONS:
            continue
        full_name = p.get("full_name")
        if not full_name:
            continue
        by_norm_name.setdefault(normalize(full_name), []).append(p)

    local_players = json.loads(PLAYERS_PATH.read_text())
    local_names = {p["name"] for p in local_players}

    candidates_by_name: dict[str, str] = {}
    for name in local_names:
        candidates = by_norm_name.get(normalize(name))
        if not candidates:
            continue
        # Prefer the most "known" match when a name collides across two people.
        best = min(candidates, key=lambda p: p.get("search_rank") or 9999999)
        candidates_by_name[name] = best["player_id"]

    print(f"Verifying {len(candidates_by_name)} candidate avatars have images...")
    with ThreadPoolExecutor(max_workers=32) as pool:
        checks = dict(
            zip(
                candidates_by_name.keys(),
                pool.map(has_avatar, candidates_by_name.values()),
            )
        )

    avatars = {
        name: pid for name, pid in candidates_by_name.items() if checks[name]
    }

    OUT_PATH.write_text(json.dumps(avatars, sort_keys=True, indent=2))
    print(
        f"Matched {len(avatars)}/{len(local_names)} names "
        f"({len(candidates_by_name) - len(avatars)} dropped, no image) -> {OUT_PATH}"
    )


if __name__ == "__main__":
    main()
