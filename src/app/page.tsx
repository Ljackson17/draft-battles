"use client";

import { useEffect, useState } from "react";
import type {
  GamePlayer,
  GameState,
  MatchSettings,
  MatchState,
  PromptDeck,
  RosterPick,
  RosterSlot,
} from "@/lib/types";
import { ROSTER_SLOTS } from "@/lib/roster";
import { BOARDS_PER_MATCH } from "@/lib/match";
import { promptForSlot } from "@/data/prompts";
import { RANDOM_DECK_ID } from "@/lib/decks";
import { BUILT_IN_DECKS } from "@/lib/builtInDecks";
import { lookupPick } from "@/lib/playerData";
import { computePlacementPoints, pointsFor, totalScore } from "@/lib/scoring";
import {
  clearMatchState,
  loadDecks,
  loadMatchState,
  saveDecks,
  saveMatchState,
} from "@/lib/storage";
import SetupScreen from "@/components/SetupScreen";
import DraftDesk from "@/components/DraftDesk";
import MatchResultsScreen from "@/components/MatchResultsScreen";

const DEFAULT_MATCH_SETTINGS: MatchSettings = {
  timerSeconds: 30,
  scoring: "ppr",
  deckIds: Array(BOARDS_PER_MATCH).fill(RANDOM_DECK_ID),
};

function initialMatchState(): MatchState {
  return {
    phase: "setup",
    settings: DEFAULT_MATCH_SETTINGS,
    gmName: "",
    matchPlayers: [],
    boardIndex: 0,
    standings: {},
    usedPlayerNames: new Set(),
    boardResults: [],
    game: null,
  };
}

function freshBoard(
  matchPlayers: MatchState["matchPlayers"],
  settings: MatchSettings,
  boardIndex: number,
  gmName: string,
  deckList: PromptDeck[],
): GameState {
  const players: GamePlayer[] = matchPlayers.map((mp) => ({
    id: mp.id,
    name: mp.name,
    roster: {},
  }));
  const { prompt, usedPromptIds } = promptForSlot(
    settings.deckIds[boardIndex],
    deckList,
    0,
    [],
  );
  return {
    phase: "draft",
    settings: {
      timerSeconds: settings.timerSeconds,
      scoring: settings.scoring,
      deckId: settings.deckIds[boardIndex],
    },
    gmName,
    players,
    usedPromptIds,
    slotIndex: 0,
    turnOrder: players.map((p) => p.id),
    currentTurnIndex: 0,
    currentPrompt: prompt,
    revealIndex: 0,
  };
}

export default function Home() {
  const [match, setMatch] = useState<MatchState>(initialMatchState);
  const [decks, setDecks] = useState<PromptDeck[] | null>(null);

  // Restore any in-progress match and saved prompt decks after mount (both
  // are localStorage-backed external stores, so hydrating them has to
  // happen client-side, one time, after the SSR-safe initial render).
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const saved = loadMatchState();
    if (saved) setMatch(saved);
    setDecks(loadDecks());
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Keep the in-progress match persisted so an accidental refresh mid-round
  // doesn't lose it. The blank setup form is never persisted.
  useEffect(() => {
    if (match.phase === "setup") return;
    saveMatchState(match);
  }, [match]);

  useEffect(() => {
    if (decks !== null) saveDecks(decks);
  }, [decks]);

  const customDecks = decks ?? [];
  const deckList = [...BUILT_IN_DECKS, ...customDecks];

  const startMatch = (
    names: string[],
    gmName: string,
    settings: MatchSettings,
  ) => {
    const matchPlayers = names.map((name) => ({
      id: crypto.randomUUID(),
      name,
    }));
    const game = freshBoard(matchPlayers, settings, 0, gmName, deckList);
    setMatch({
      phase: "board",
      settings,
      gmName,
      matchPlayers,
      boardIndex: 0,
      standings: Object.fromEntries(matchPlayers.map((p) => [p.id, 0])),
      usedPlayerNames: new Set(),
      boardResults: [],
      game,
    });
  };

  /** Applies a pick to the current player's roster immediately, then
   * advances the turn — or, if that was the slot's last pick, rolls the
   * board over to the reveal phase. */
  const applyPick = (pick: RosterPick) => {
    setMatch((prev) => {
      if (!prev.game) return prev;
      const game = prev.game;
      const slot = ROSTER_SLOTS[game.slotIndex];
      const currentPlayerId = game.turnOrder[game.currentTurnIndex];
      const players = game.players.map((p) =>
        p.id === currentPlayerId
          ? { ...p, roster: { ...p.roster, [slot]: pick } }
          : p,
      );
      const usedPlayerNames = new Set(prev.usedPlayerNames);
      if (pick.status === "filled") {
        usedPlayerNames.add(pick.playerName);
      }

      const nextTurnIndex = game.currentTurnIndex + 1;
      if (nextTurnIndex < game.turnOrder.length) {
        return {
          ...prev,
          usedPlayerNames,
          game: { ...game, players, currentTurnIndex: nextTurnIndex },
        };
      }

      const nextSlotIndex = game.slotIndex + 1;
      if (nextSlotIndex >= ROSTER_SLOTS.length) {
        return {
          ...prev,
          usedPlayerNames,
          game: { ...game, players, phase: "reveal", revealIndex: 0 },
        };
      }

      const rotatedTurnOrder = [...game.turnOrder.slice(1), game.turnOrder[0]];
      const { prompt: nextPrompt, usedPromptIds } = promptForSlot(
        prev.settings.deckIds[prev.boardIndex],
        deckList,
        nextSlotIndex,
        game.usedPromptIds,
      );

      return {
        ...prev,
        usedPlayerNames,
        game: {
          ...game,
          players,
          slotIndex: nextSlotIndex,
          turnOrder: rotatedTurnOrder,
          currentTurnIndex: 0,
          currentPrompt: nextPrompt,
          usedPromptIds,
        },
      };
    });
  };

  const lockValidPick = (name: string, season: number) => {
    const found = lookupPick(name, season);
    if (!found) return;
    const points = pointsFor(
      match.settings.scoring,
      found.fantasyPoints,
      found.fantasyPointsPpr,
    );
    applyPick({
      status: "filled",
      playerName: name,
      season,
      position: found.position,
      team: found.team,
      points,
    });
  };

  const markBrick = () => applyPick({ status: "brick", points: 0 });

  /** Lets the GM fix a misclick on an already-entered pick, without
   * touching turn order or advancing the slot — only that one cell
   * changes. `pick` of null clears the slot back to empty. */
  const editPick = (
    playerId: string,
    slot: RosterSlot,
    pick: RosterPick | null,
  ) => {
    setMatch((prev) => {
      if (!prev.game) return prev;
      const game = prev.game;
      const oldPick = game.players.find((p) => p.id === playerId)?.roster[
        slot
      ];
      const usedPlayerNames = new Set(prev.usedPlayerNames);
      if (oldPick?.status === "filled") {
        usedPlayerNames.delete(oldPick.playerName);
      }
      if (pick?.status === "filled") {
        usedPlayerNames.add(pick.playerName);
      }
      const players = game.players.map((p) => {
        if (p.id !== playerId) return p;
        const roster = { ...p.roster };
        if (pick) {
          roster[slot] = pick;
        } else {
          delete roster[slot];
        }
        return { ...p, roster };
      });
      return { ...prev, usedPlayerNames, game: { ...game, players } };
    });
  };

  const editLockValid = (
    playerId: string,
    slot: RosterSlot,
    name: string,
    season: number,
  ) => {
    const found = lookupPick(name, season);
    if (!found) return;
    const points = pointsFor(
      match.settings.scoring,
      found.fantasyPoints,
      found.fantasyPointsPpr,
    );
    editPick(playerId, slot, {
      status: "filled",
      playerName: name,
      season,
      position: found.position,
      team: found.team,
      points,
    });
  };

  const revealNext = () => {
    setMatch((prev) =>
      prev.game
        ? {
            ...prev,
            game: {
              ...prev.game,
              revealIndex: Math.min(
                prev.game.revealIndex + 1,
                ROSTER_SLOTS.length,
              ),
            },
          }
        : prev,
    );
  };

  /** Scores the just-finished board into the match standings, then either
   * starts the next board or, after the last one, ends the match. */
  const continueMatch = () => {
    setMatch((prev) => {
      if (!prev.game) return prev;
      const scores: Record<string, number> = {};
      prev.game.players.forEach((p) => {
        scores[p.id] = totalScore(p);
      });
      const placementPoints = computePlacementPoints(scores);
      const standings = { ...prev.standings };
      for (const [id, pts] of Object.entries(placementPoints)) {
        standings[id] = (standings[id] ?? 0) + pts;
      }

      const deckId = prev.settings.deckIds[prev.boardIndex];
      const deck = deckList.find((d) => d.id === deckId);
      const boardResults = [
        ...prev.boardResults,
        {
          deckId,
          deckName: deckId === RANDOM_DECK_ID ? "Random mix" : (deck?.name ?? "Deck"),
          scores,
          placementPoints,
        },
      ];

      const nextBoardIndex = prev.boardIndex + 1;
      if (nextBoardIndex >= prev.settings.deckIds.length) {
        return {
          ...prev,
          phase: "complete",
          standings,
          boardResults,
          game: null,
        };
      }

      const game = freshBoard(
        prev.matchPlayers,
        prev.settings,
        nextBoardIndex,
        prev.gmName,
        deckList,
      );
      return { ...prev, boardIndex: nextBoardIndex, standings, boardResults, game };
    });
  };

  const abandonMatch = () => {
    clearMatchState();
    setMatch(initialMatchState());
  };

  const createDeck = (deck: PromptDeck) =>
    setDecks((prev) => [...(prev ?? []), deck]);
  const updateDeck = (deck: PromptDeck) =>
    setDecks((prev) => (prev ?? []).map((d) => (d.id === deck.id ? deck : d)));
  const deleteDeck = (id: string) =>
    setDecks((prev) => (prev ?? []).filter((d) => d.id !== id));

  if (match.phase === "setup") {
    return (
      <SetupScreen
        onStart={startMatch}
        builtInDecks={BUILT_IN_DECKS}
        customDecks={customDecks}
        onCreateDeck={createDeck}
        onUpdateDeck={updateDeck}
        onDeleteDeck={deleteDeck}
      />
    );
  }

  if (match.phase === "complete") {
    return (
      <MatchResultsScreen
        matchPlayers={match.matchPlayers}
        standings={match.standings}
        boardResults={match.boardResults}
        onNewMatch={abandonMatch}
      />
    );
  }

  if (!match.game) return null;

  return (
    <DraftDesk
      phase={match.game.phase}
      players={match.game.players}
      slotIndex={match.game.slotIndex}
      prompt={match.game.currentPrompt}
      turnOrder={match.game.turnOrder}
      currentTurnIndex={match.game.currentTurnIndex}
      timerSeconds={match.settings.timerSeconds}
      usedPlayerNames={match.usedPlayerNames}
      gmName={match.gmName}
      revealIndex={match.game.revealIndex}
      boardIndex={match.boardIndex}
      totalBoards={BOARDS_PER_MATCH}
      matchStandings={match.standings}
      onLockValid={lockValidPick}
      onMarkBrick={markBrick}
      onEditLockValid={editLockValid}
      onEditMarkBrick={(playerId, slot) =>
        editPick(playerId, slot, { status: "brick", points: 0 })
      }
      onClearPick={(playerId, slot) => editPick(playerId, slot, null)}
      onRevealNext={revealNext}
      onContinue={continueMatch}
      onAbandonMatch={abandonMatch}
    />
  );
}
