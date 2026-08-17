# Word Rally — Design System & Guidelines

The look is **retro arcade / 8-bit cartridge**: chunky bevelled panels, hard
drop-shadows, a pixel display face, and a saturated CRT-era palette on a dotted
background. This document is the human-readable companion to the machine source
of truth, [`src/theme.ts`](src/theme.ts) — every token below is exported from there.
**Change a value in `theme.ts` and it propagates everywhere; never hardcode a hex
in a component when a token exists.**

---

## 1. Palette (`color`)

| Token | Hex | Role |
|-------|-----|------|
| `ink` | `#21242e` | Near-black outline & primary text |
| `inkSoft` | `#60619c` | Muted dividers, secondary text |
| `white` | `#ffffff` | Panel faces, canvas |
| `panel` | `#dedede` | Raised grey panel face |
| `base` | `#7a8aba` | App background blue |
| `grid` | `#8ba1d4` | Dot-grid highlight / mid blue |
| `sky` | `#9fbee7` | Light blue fills, info strips |
| `lavender` | `#acace7` | Hero / soft purple |
| `royal` | `#3d4f97` | Structural blue: borders, links, labels |
| `orange` | `#f68d1f` | **Primary action accent** (CTAs) |
| `gold` | `#ecab37` | Secondary / badges / headers |
| `red` | `#e60012` | Scores, alerts, room code, timer <10s |
| `teal` | `#206479` | "Pick" phase banner |
| `crimson` | `#a7282b` | Winner banner |

**Player avatars** use `PALETTE` (`src/data.ts`) with `pickColor(seed)` for a stable
per-user color from their id.

### Accent usage rule
`orange` is the single primary action color — one orange CTA per view. `gold` is for
secondary emphasis and section headers. `red` is reserved for scores/urgency; never use
it for a button.

---

## 2. Bevels (`edge`, `bevel`, `bevelY`)

The 3D "plastic button" effect is a two-tone border: a **highlight** on top+left and a
**shadow** on bottom+right. Named pairs live in `edge`:

`gold`, `orange`, `panel`, `blue`, `lavender`, `teal`, `crimson`, `sky`, `dark`, `code`.

```ts
style={{ background: color.gold, ...bevel(edge.gold) }}      // raised, 4 sides
style={{ background: color.ink, ...bevelY(edge.dark) }}      // top/bottom only (flat bars)
```

- **Raised** element → highlight pair top-left, shadow bottom-right (default `bevel`).
- Width defaults to `2px`; pass a second arg for thicker frames.
- Inputs use a plain `1px solid #5a5f8c`, not a bevel — bevels are for surfaces & buttons.

---

## 3. Typography (`font`)

| Token | Family | Use |
|-------|--------|-----|
| `display` | **Archivo Black** (italic, `WebkitTextStroke`) | Big hero titles via `displayTitle()` |
| `pixel` | **Silkscreen** | Labels, clocks, room code, meta — the "system" voice |
| `body` | Arial / Helvetica | All prose, inputs, buttons |

`displayTitle(size, shadowColor, strokeW?)` returns the signature white-fill,
ink-stroke, hard-offset-shadow italic title. Use it for one hero per screen only.

Sizes cluster at **10–13px** for chrome/labels, **12–15px** for body, **20–56px** for
display. Weight is `700` almost everywhere; letter-spacing `.5px` on uppercase labels.

---

## 4. Helpers

- `dots(colorStr, size?)` — the radial-dot background used on the shell and dark strips.
- `displayTitle(size, shadow, strokeW?)` — hero title style.
- `chatStyle[kind]` — guess-feed message skins, keyed by `ChatKind`:

| kind | bg | fg | edge | Meaning |
|------|----|----|------|---------|
| `chat` | white | royal | sky | Ordinary chat |
| `wrong` | white | ink | inkSoft | Wrong guess |
| `right` | orange | white | dark-orange | Correct — round locks |
| `sys` | gold | ink | dark-gold | System / "so close" nudge |

---

## 5. Components (`src/components`)

- **`Panel`** — the workhorse card: raised grey surface, optional titled header bar
  (`headerBg` defaults to `base`). Compose everything list-like inside a Panel.
- **`Button`** — bevelled arcade button. Variants: `primary` (orange CTA), `gold`,
  `dark`, `ghost`. Sizes `sm` | `md`. Min-heights meet tap targets (see §7).
- **`Toast`** — transient pixel-font confirmation (`useToast()` from context).
- **Chrome** (`Chrome.tsx`) — `Header` (logo + room code + copy), `PhaseBar` (read-only
  phase indicator; screens are driven by `room.status`, not free navigation), `StatusBar`
  (round/roles/online count), `Footer`, and `Splash` (loading text).

---

## 6. Layout

- Centered column, `max-width: 1060px`, `12px` gutters.
- Responsive **without media queries**: grids use
  `repeat(auto-fit, minmax(<min>, 1fr))` and flex rows use `flex-wrap` with
  `flex: <grow> 1 <basis>`. The play board is `flex: 100 1 420px` so it dominates while
  the scoreboard/feed hold `~160–240px` floors.
- Wide/interactive media (the canvas) sits in an `overflow: hidden` bevelled frame and
  scales via `width: 100%; height: auto` over a fixed `760×430` backing store.

---

## 7. Guidelines & accessibility

- **Tap targets:** primary buttons `≥44px`, chrome buttons `≥34px`, tool buttons `≥30px`.
  Keep new interactive elements within these floors.
- **One hero, one primary CTA** per screen.
- **Contrast:** body text is `ink` on light fills. Avoid `inkSoft` for anything smaller
  than 11px that must be read; it's for de-emphasis.
- **Reuse tokens, not literals.** New surface? Pick an existing `edge` pair. New status
  color? Add it to `color` in `theme.ts` first, then reference it.
- **Adding a screen:** build it from `Panel` + `Button`, drive its data from
  `useRoom`/props (never mock), render it from a `room.status` branch in `App.tsx`, and
  add its phase to `PHASES` in `data.ts` if it should appear in the `PhaseBar`.
- Emoji glyphs (`▶`, `☰`, `✓`) are used as lightweight icons — keep them inline in text,
  don't introduce an icon font.
