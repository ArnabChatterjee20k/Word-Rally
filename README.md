# Word Rally

A realtime, round-robin **draw-and-guess party game** built on **Bun + React 19 + TypeScript**
and a **self-hosted Appwrite** backend. Each turn one player **picks** a word, the next
**draws** it, the next **guesses** it, and every seat rotates one place. Highest score after
the last round wins.

- **Design system:** [`design.md`](design.md) (tokens live in [`src/theme.ts`](src/theme.ts))
- **Realtime + Presences** drive the whole UI; **word picking & guessing are
  server-authoritative** in one Appwrite Function.

---

## Architecture

```
Browser (React)  ──RPC (functions.createExecution)──►  game function (node-appwrite + API key)
      ▲                                                        │  sole writer of authoritative state
      │  Realtime subscriptions (tablesdb.* rows)              ▼
      └──────────────────────────  Appwrite TablesDB ◄─────────┘
      └──────────────────────────  Appwrite Presences  (liveness + live drawing strokes)
```

- The client holds **no authoritative state**. It renders from live data and triggers every
  transition by calling the `game` function.
- **Screen = `room.status`** (`lobby → pick → play → score → winner`), pushed to all clients
  over Realtime — not local navigation.
- **Presences** carry both player liveness (online dots, roster) and the **live drawing**:
  the drawer broadcasts stroke batches through a room-scoped presence record, guessers
  subscribe to `presences.<id>`. Ephemeral, auto-expiring, no canvas table.
- The **secret word** lives in a `secretWords` row readable only by the **drawer**; the
  guesser can never read it, so guesses must go through the server.

### Data model — database `wordrally`

| Table | Writes | Reads | Notes |
|-------|--------|-------|-------|
| `rooms` | function (API key) | users | status, roles, `scoresJson`, timer, masked/reveal word |
| `players` | owner | users | nickname/color/ready only — **no score here** |
| `secretWords` | function | **drawer only** | plaintext word; guesser can't read it |
| `messages` | function (verdicts) + owner (chat) | users | guess feed |

### The `game` function actions (`functions/game/src/main.js`)

`createRoom · joinRoom · startMatch · pickWord · submitGuess · endTurn · nextTurn · rematch`

Caller identity is trusted from the platform header `x-appwrite-user-id` (never the body).
The turn timer (`turnEndsAt`) is server-stamped and re-checked on every guess/end, so a
skewed client clock can't extend a turn. Pure logic (scoring, near-match, rotation) is in
`functions/game/src/logic.js` with unit tests in `logic.test.js`.

---

## Prerequisites

- [Bun](https://bun.sh) ≥ 1.3
- A **self-hosted Appwrite ≥ 1.9** (needs the **Presences API** + **TablesDB**)
- The [Appwrite CLI](https://appwrite.io/docs/tooling/command-line): `npm i -g appwrite-cli`

---

## Setup

### 1. Install

```bash
bun install
```

### 2. Point the client at your instance

Edit [`src/config.ts`](src/config.ts) — set `endpoint` (your `https://<host>/v1`) and
`projectId`. (Or set them at runtime without editing code: in the browser console run
`localStorage.setItem('wr_endpoint', 'https://<host>/v1')` and `wr_project`, then reload.)

### 3. Deploy the backend (tables + function)

```bash
appwrite login --endpoint "https://<your-host>/v1"
# create the project in Console (id: wordrally) or run: appwrite init project
#  → then set the same endpoint + projectId in appwrite.config.json

# copy the API-key env for the function (optional on 1.9+ — a dynamic key is injected)
cp functions/game/.env.example functions/game/.env   # fill APPWRITE_API_KEY if needed

appwrite push settings     # enables anonymous auth
appwrite push tables       # creates the 4 tables, indexes, permissions
appwrite push functions --function-id game --with-variables
```

> Verify after push: `rooms.code` has a **unique** index, and `secretWords` has **no**
> table-level read permission (only the per-row drawer grant the function sets).

### 4. Run

```bash
bun dev        # http://localhost:3000  (HMR)
```

---

## Testing

```bash
bun test functions/game/src/logic.test.js   # pure game logic
bunx tsc --noEmit                            # typecheck
bun build ./index.html --outdir dist         # production bundle
```

### Live end-to-end (against the deployed function)

`scripts/e2e.ts` drives a full match with three anonymous guests through the deployed
`game` function and asserts every server-authority guarantee. Sessions are minted with a
short-lived ephemeral API key (the only way to hold a session outside a browser):

```bash
KEY=$(bunx appwrite-cli project create-ephemeral-key \
  --scopes sessions.write --duration 3600 --json --show-secrets --force | bun -e 'process.stdin.text?.().then(t=>console.log(JSON.parse(t).secret))')
WR_KEY="$KEY" bun run scripts/e2e.ts     # → 41 passed, 0 failed
```

### End-to-end (two browser windows = two guests)

1. Window **A**: enter a nickname → **Create Room** → note the 4-letter code.
2. Window **B**: enter the code → **Join Game**. Both rosters update live (Realtime +
   Presence green dots).
3. A (host) **Start Match** (needs 3+ players) → both go to **Pick**. Picker chooses a
   word → **Play**.
4. Drawer draws → **guesser sees strokes live**. Guess `rokat` (wrong) → wrong; a near
   miss → "so close"; the exact word → scores update, reveal, → **Score**. **Next Turn**
   rotates roles. Exhaust the rounds → **Winner** → **Rematch**.

**Security checks:** the guesser's session cannot read `secretWords`; a `submitGuess` from
a non-guesser is rejected; a guess after `turnEndsAt` is rejected.

---

## Project layout

```
index.html              Bun HTML entrypoint (bundles src/index.tsx)
src/
  theme.ts              design tokens (see design.md)
  data.ts               phases, swatches, word-choice builder, palette
  words.json            the word bank (data, not code)
  config.ts             Appwrite endpoint/project/table ids + channel helpers
  lib/                  appwrite client, session, RPC, useRoom, presence, types, score
  components/           Panel, Button, Toast, Chrome
  screens/              Landing, Lobby, Pick, Play, Score, Winner
functions/game/         the server-authoritative Appwrite Function (+ logic tests)
appwrite.config.json    tables, indexes, permissions, function + settings
```

---

## Known limitations (MVP)

Ephemeral drawing means a guesser who joins/refreshes mid-turn sees a blank canvas until
the next stroke. Deferred: typing indicators, awards, reconnection/late-join replay,
spectator polish, profanity filtering, per-turn drawer-only stroke permissions.
