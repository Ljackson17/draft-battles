import { loadBuiltInDecks } from "@/lib/builtInDecks";
import HomeClient from "@/components/HomeClient";

// Server Component so it can read src/data/decks/ off disk at request time —
// any JSON file dropped in there shows up as a deck option with no code
// changes needed.
export default function Page() {
  const builtInDecks = loadBuiltInDecks();
  return <HomeClient builtInDecks={builtInDecks} />;
}
