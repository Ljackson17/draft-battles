#!/usr/bin/env python3
"""
Builds the app's local player-season dataset from two sources:

- nflverse season-level player stats, 1999-2025 (fantasy points precomputed).
  Source: https://github.com/nflverse/nflverse-data (stats_player release)
  License: CC-BY 4.0 (see README for attribution)
- Kaggle heefjones/nfl-fantasy-data-1970-2024, used only for the 1970-1998
  seasons nflverse doesn't cover. Fantasy points aren't provided pre-computed
  in standard/PPR form there, so they're derived from the raw box-score
  columns using the same standard scoring formula nflverse uses
  (pass yds/25, pass TD*4, INT*-2, rush/rec yds/10, rush/rec TD*6,
  fumble lost*-2; PPR adds 1pt/reception).
  License: Apache-2.0
"""
import csv
import json
from pathlib import Path

NFLVERSE_START_YEAR = 1999
NFLVERSE_END_YEAR = 2025
KAGGLE_END_YEAR = 1998  # nflverse takes over from 1999 onward
SKILL_POSITIONS = {"QB", "RB", "WR", "TE"}
OUT_PATH = Path(__file__).parent.parent / "src" / "data" / "players.json"
RAW_DIR = Path(__file__).parent / "raw"
KAGGLE_CSV = Path(__file__).parent / "raw_kaggle" / "fantasy_data.csv"


def fetch_nflverse_year(year: int) -> list[dict]:
    path = RAW_DIR / f"{year}.csv"
    print(f"Parsing nflverse {year}...")
    text = path.read_text(encoding="utf-8")
    reader = csv.DictReader(text.splitlines())
    rows = []
    for row in reader:
        pos = row.get("position", "")
        if pos not in SKILL_POSITIONS:
            continue
        try:
            games = int(row.get("games") or 0)
        except ValueError:
            games = 0
        if games == 0:
            continue
        try:
            fp = float(row.get("fantasy_points") or 0)
            fp_ppr = float(row.get("fantasy_points_ppr") or 0)
        except ValueError:
            fp, fp_ppr = 0.0, 0.0
        rows.append(
            {
                "name": row.get("player_display_name", "").strip(),
                "position": pos,
                "team": row.get("recent_team", ""),
                "season": year,
                "games": games,
                "fantasyPoints": round(fp, 2),
                "fantasyPointsPpr": round(fp_ppr, 2),
            }
        )
    return rows


def _num(row: dict, key: str) -> float:
    v = row.get(key, "")
    try:
        return float(v) if v not in ("", None) else 0.0
    except ValueError:
        return 0.0


def fetch_kaggle_pre1999() -> list[dict]:
    print(f"Parsing Kaggle historical data (through {KAGGLE_END_YEAR})...")
    text = KAGGLE_CSV.read_text(encoding="utf-8")
    reader = csv.DictReader(text.splitlines())
    rows = []
    for row in reader:
        year_raw = row.get("Year", "")
        if not year_raw:
            continue
        year = int(year_raw)
        if year > KAGGLE_END_YEAR:
            continue
        pos = row.get("Pos", "")
        if pos not in SKILL_POSITIONS:
            continue
        try:
            games = int(float(row.get("G") or 0))
        except ValueError:
            games = 0
        if games == 0:
            continue

        std_points = (
            _num(row, "Pass_Yds") / 25
            + _num(row, "Pass_TD") * 4
            + _num(row, "Pass_Int") * -2
            + _num(row, "Rush_Yds") / 10
            + _num(row, "Rush_TD") * 6
            + _num(row, "Rec_Yds") / 10
            + _num(row, "Rec_TD") * 6
            + _num(row, "FmbLost") * -2
        )
        ppr_points = std_points + _num(row, "Rec_Rec") * 1

        rows.append(
            {
                "name": row.get("Player", "").strip(),
                "position": pos,
                "team": row.get("Tm", ""),
                "season": year,
                "games": games,
                "fantasyPoints": round(std_points, 2),
                "fantasyPointsPpr": round(ppr_points, 2),
            }
        )
    return rows


def main():
    all_rows: list[dict] = []
    for year in range(NFLVERSE_START_YEAR, NFLVERSE_END_YEAR + 1):
        try:
            all_rows.extend(fetch_nflverse_year(year))
        except Exception as e:
            print(f"  skipped {year}: {e}")

    try:
        all_rows.extend(fetch_kaggle_pre1999())
    except Exception as e:
        print(f"  skipped Kaggle historical data: {e}")

    all_rows.sort(key=lambda r: (r["season"], r["name"]))
    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUT_PATH.write_text(json.dumps(all_rows, separators=(",", ":")))
    print(f"Wrote {len(all_rows)} player-seasons to {OUT_PATH}")


if __name__ == "__main__":
    main()
