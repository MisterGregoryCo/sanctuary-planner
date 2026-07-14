# Sanctuary Planner — Project Documentation

**Handoff doc for Claude Code sessions.** Everything you need to understand, run, and extend this project.

---

## What This Is

An interactive floor plan and seating capacity tool for churches, venues, and event spaces. Enter any room's dimensions, choose a stage layout, and instantly see a rendered SVG floor plan with chair placement, total seat count, and space utilization.

Built originally for **Collective Church** (a church plant in Murfreesboro, TN evaluating a former indoor batting cage facility with a 56'11" × 54'4" sanctuary space), then generalized to work for any room. As of July 2026 it is a **fully standalone project** — no longer tied to the Collective Church Vercel project.

**Live production URL:** https://sanctuary-planner.vercel.app

**Vercel project:** `sanctuary-planner` (prj_C9QRfk0Fbm9NC4Y8BgGWYnKMAjdS) on team `mistergregorycos-projects` (team_LWFY4rTHuGyC6ypVxXD4o7KV)

**GitHub repo:** https://github.com/MisterGregoryCo/sanctuary-planner (connected to Vercel — pushes to `main` auto-deploy to production)

**Local working copy:** `~/Desktop/Mallard Studios - Projects/Sanctuary Planner`

> Historical: the first deployment lived inside the `collective-church` Vercel project (https://collective-church-mistergregorycos-projects.vercel.app, prj_WuYO0dhqsb2NS0mWfPK6spulQdGs). That deployment is behind Vercel deployment-protection login and is superseded by the standalone URL above. The GitHub repo previously held an abandoned TypeScript/Tailwind scaffold with some mobile-layout work — preserved in git history at commit `0e7bfac` if worth porting.

---

## Current Tech Stack

- **Next.js 14** (App Router, JavaScript — not TypeScript in the deployed version)
- **React 18** with hooks (useState, useMemo)
- **Pure inline styles** — no Tailwind, no CSS modules, no component libraries
- **Hand-rolled SVG rendering** — no charting or canvas libraries
- Deployed via GitHub → Vercel auto-deploy (push to `main`), or `vercel deploy --prod` from the project folder

### File Structure

```
sanctuary-planner/
├── package.json           # next ^14.2.0, react ^18.2.0
├── next.config.js         # default config
├── src/app/
│   ├── layout.js          # metadata + root layout
│   ├── globals.css        # dark theme base, range slider styling, number input cleanup
│   └── page.js            # THE ENTIRE APP — single client component (~200 lines dense)
```

Everything lives in `page.js`. It's intentionally a single file for easy deploys, but should be split into components if the project grows.

---

## Features (as deployed, v1.4.0)

### Room Configuration
- **Width + Depth + Ceiling inputs**: separate feet and inches fields
  - CRITICAL UX detail: inputs use local string state (`ftText`/`inText`) with focus tracking so users can fully clear a field while typing. Validation happens on blur, not per keystroke. Values clamp: feet 5–200 (ceiling 6–60), inches 0–11. Don't regress this — it was a reported bug.
  - Ceiling height (added v1.2.0) is informational — shown in the readout row and on the floor plan's top-right corner label. It does not affect seating math (yet — it matters for future AV overlays: projector throw, speaker rigging)
- **Clearance sliders** (added v1.2.0): Wall Buffer (0–8', step 0.5, default 3') and Stage Gap (0.5–8', step 0.5, default 2.5') — these feed directly into all four seating algorithms and the usable-sq-ft readout. The footer assumptions line updates live to match
- **Door/Entry location toggle**: Bottom / Top / Left / Right — renders a gold indicator line on the chosen wall
- **Live sq ft readout**: total, usable (total minus wall buffer on all sides), and ceiling height

### Four Stage Layouts (tab switcher) — every layout has an aisle-count toggle as of v1.3.0
1. **Center Octagon** (⬡) — octagonal stage in room center, curved seating rows radiating outward in sections. Controls: stage size slider (8–24', represents flat-to-flat width), aisle count toggle (4/6/8 radial aisles)
2. **Front Stage** (▬) — rectangular stage centered against the top wall. Controls: stage width (12' to room width minus 4'), stage depth (6–50'), aisles toggle (1/2/3). Straight seating sections split by evenly-spaced aisles. Shows WING labels beside stage when side space > 4'
3. **Corner Stage** (◣) — triangular wedge in bottom-left corner with dashed curved front edge. Seating in quarter-circle arcs fanning from the corner. Controls: stage size (8–24'), aisles toggle (1/2/3 radial)
4. **Half Circle** (◖) — semicircular stage, flat edge against top wall, curve facing the room. Seating in concentric half-arcs. Controls: stage radius (5–20', so 10–40' across), aisles toggle (1/2/3 radial)

### 3D View (v1.3.0)
- **2D Plan / 3D View toggle** above the floor plan, plus a Rotate slider (0–360°, step 5°) in 3D mode
- Hand-rolled axonometric SVG projection in the `Iso3D` component — **no 3D libraries**. Orthographic projection (depth foreshortened ×0.5, height ×0.9) with painter's-algorithm depth sorting
- Renders: floor with 5' grid, translucent back walls + wireframe rim/posts at the entered **ceiling height**, extruded stage per layout, chairs as depth-sorted 3D boxes with viewer-facing side faces, gold door indicator on the floor
- **Stage Height slider** (v1.4.0): 0–6', step 0.25', default 1.5' — always visible in the layout controls row; drives the 3D stage extrusion (clamped to ceiling height) and the "N' high" caption on the 3D stage. No effect on the 2D plan or seat counts
- Same compute functions feed both views, so seat counts always match

### Stats Bar (live-updating)
- **Seats** — total chairs placed
- **Sq Ft Seated** — seats × 5
- **Utilization %** — (seats × 5) / total room sq ft

### Rendering Details
- SVG with a subtle grid pattern (1 grid square = 1 foot)
- Room outline with dimension labels formatted as `56'-11"`
- Chairs: rounded green rects at true scale — `CHAIR_WIDTH * scale * 0.85` px (v1.3.0; was fixed 6×6px regardless of room size), rotated to face the stage, 3px floor
- Stage: gold (#c9935a) with SVG glow filter and gradient fill
- Row guide circles/arcs drawn faintly behind chairs
- Dynamic scale: `Math.min(12, (660 - PAD*2) / max(roomWidth, 20))` so any room fits ~660px width

---

## Layout Math (the core logic)

All units in feet. Constants at top of page.js:

```
ROW_SPACING  = 3      // 36" row-to-row
CHAIR_WIDTH  = 1.83   // ~22" per chair
PAD          = 48     // SVG pixel padding around the room
```

Wall buffer and stage gap were constants (`WALL_BUFFER = 3`, `STAGE_BUFFER = 2.5`) through v1.1.0; since v1.2.0 they are user-adjustable state (`wallBuf`, `stageBuf`) passed into every compute function as `wb`/`sb` params (defaults 3 and 2.5 preserve old behavior — verified: same seat counts at defaults).

Aisles are 5' wide everywhere (represented as ±2.5' exclusion zones).
Every chair is assumed to consume ~5 sq ft including personal space.

### computeCenter(rw, rh, stageR, numAisles, wb, sb)
Radial sections around center point. For each section and each row radius `r = stageR + sb + rowIndex * 3`:
- Aisle half-angle: `asin(min(2.5 / r, 0.99))`
- Available arc angle = sectionAngle − 2 × aisleHalfAngle
- Chairs = floor(arcLength / CHAIR_WIDTH), evenly distributed
- Clip each chair to `inRoom()` (inside wall buffer)

### computeFront(rw, rh, stageW, stageD, wb, sb)
Straight rows from `stageD + sb` down to `rh - wb`, stepping 3'. (Pre-v1.2.0 the seat start was hardcoded `stageD + 3`, inconsistent with the 2.5' gap elsewhere; now it honors the stage-gap setting uniformly — at the 2.5' default this happens to produce the same row count for typical rooms.)
Seating area split into 3 sections by aisles centered at 33% and 66% of seating width. Chairs centered within each section per row.

### computeCorner(rw, rh, size, wb, sb)
Quarter-circle arcs from origin at bottom-left corner (0, rh), angles −90° to 0°. Stage reach = size × 1.1. Two aisles at 33%/66% of arc angle (excluded via angular half-width `2.5 / r`).

### computeHalf(rw, rh, stageR, wb, sb)
Half-circle arcs from center-top point (rw/2, 0), angles ~0.06 to π−0.06 rad (slight inset from the wall). Same aisle exclusion pattern as corner. Chairs face the stage center point.

### Coordinate System
Room coordinates are in feet, origin top-left, y increases downward (matches SVG). Transform helpers:
```
tx(x, scale) = PAD + x * scale
ty(y, scale) = PAD + y * scale
```
Chair rotation: `(angle * 180/π) + 90` degrees around chair center, where `angle` is the chair's angular position relative to the stage focal point (or −π/2 for straight rows).

---

## Design System

Dark, architectural, blueprint-inspired aesthetic:

| Token | Value | Use |
|---|---|---|
| bg deep | `#060910` | page background |
| bg canvas | `#0a0e15` | SVG background |
| bg card | `#111923` | control cards, stat bar |
| border | `#1c2538` | card borders, inactive toggles |
| room outline | `#2a3550` | floor plan walls |
| grid lines | `#141b28` | 1-ft grid, row guides |
| accent gold | `#c9935a` | stage, active states, door marker |
| chair green | `#4a9e7a` (stroke `#6acd9a`) | chairs, seat count |
| info blue | `#5a8fc4` | sq ft stat, notes |
| muted text | `#4e5d73` | labels, footers |
| secondary text | `#8898aa` | section headers |

Typography: Georgia/serif for the H1 and big stat numbers; system sans-serif for all UI. Labels are 10px uppercase with 1.5px letter-spacing.

---

## Project History / Context

1. Started as a Claude.ai artifact for one specific building walkthrough (Collective Church, 56'11" × 54'4" space, currently an indoor batting cage facility — photos showed metal building, concrete slab, roll-up door, red steel columns, turf to be removed)
2. First version: center octagon only. Then expanded to 3 layouts, then generalized to accept any room dimensions
3. Deployed to Vercel via MCP `deploy_to_vercel` into the existing `collective-church` project (creating a new project via MCP hit a 403 permission error on this team — the Vercel CLI does NOT have this problem)
4. Half-circle layout added in v1.1.0
5. July 2026: extracted into a standalone project. Source pulled from the collective-church production deployment via the Vercel API, committed to the `sanctuary-planner` GitHub repo (superseding the old TS scaffold there), deployed to its own `sanctuary-planner` Vercel project with GitHub auto-deploy connected. Fixed literal `·` escape sequences that rendered as raw text in the subtitle/footer
6. v1.2.0 (July 2026): wall buffer and stage gap became adjustable sliders (0–8' / 0.5–8'); added ceiling height input (informational — readout row + floor plan corner label)
7. v1.3.0 (July 2026): aisle-count toggle on every layout (1/2/3 for front/corner/half — evenly spaced, generalizing the old fixed 33%/66% which was the k=2 case; note the old 0.33/0.66 asymmetry gained ~1 chair/row on front, so front counts shifted slightly); chairs now render at true scale in the 2D plan; added 3D axonometric view with rotation slider (uses ceiling height for wall rendering)
8. v1.4.0 (July 2026): stage height slider (0–6') — 3D stage extrudes at true height, replacing the hardcoded 1.5' riser

### Known constraints from the actual building (for Collective Church use)
- Roll-up door on one wall (currently modeled as "Bottom")
- Red steel structural columns along walls
- Ceiling peak runs along the long axis (good for center-line lighting/rigging)
- Weekly reset requirement — church meets in a shared/portable context, so nothing can assume permanent installation

---

## Roadmap Ideas (validated need FIRST — do not build speculatively)

The owner (Greg) has an explicit working rule: **validate before building.** The immediate next step for any of these is a conversation with a real AV integrator (e.g., CCI Solutions, Tumwater WA), not code.

Discussed potential direction: a sales-enablement tool for AV integration companies — something a rep uses ON SITE during a walkthrough, upstream of SketchUp (which serves the design phase, not the sales phase).

Feature candidates, in rough priority order if validated:
1. **Branded PDF export** — proposal-ready floor plan with company logo, same-day turnaround after a site visit. Likely the highest-value feature.
2. **Equipment overlay layer** — speaker coverage cones, projector throw distance, screen sightlines, camera positions
3. **Shareable client links** — read-only URL a client can forward (no login)
4. **Egress/occupancy checking** — flag IBC assembly-occupancy violations (aisle widths, occupant load)
5. **Save/load projects** — would need Supabase (Greg's standard stack: Next.js 14 + Supabase + Vercel)
6. **Obstruction placement** — columns, sound booth, cry room cutouts that seating flows around
7. **Multiple doors** — currently only one entry indicator

### Engineering notes for whoever picks this up
- The deployed page.js is dense single-file code. First refactor: split into `lib/seating.js` (pure compute functions — they're already pure and testable), `components/` for the SVG renderers and controls
- Seating functions are deterministic — snapshot tests would be cheap insurance
- If adding TypeScript, the old TS/Tailwind scaffold (with sticky-sidebar and mobile-layout work) lives in git history at `0e7bfac` — but the JS version is the source of truth
- Deploy method: push to `main` on the GitHub repo (auto-deploys), or `vercel deploy --prod` from the project folder
- Keep the artifact version (claude.ai) and deployed version in sync manually, or retire the artifact now that the URL exists
- Supabase: intentionally NOT set up yet — nothing in the app needs persistence. Create a dedicated Supabase project only when save/load (roadmap #5) is validated and built

---

## Assumptions & Limitations (current)

- Rectangular rooms only
- One door indicator, cosmetic only (doesn't affect seating math)
- No obstructions modeled (columns, booths)
- Chair count is an estimate for planning conversations — not a code-compliant occupancy calculation. Real occupancy loads need IBC/local fire marshal review
- 5 sq ft/person is a planning heuristic; actual assembly occupancy factors differ (IBC uses 7 net for unconcentrated chairs, 15 net tables/chairs, etc.)
- Ceiling height affects only the 3D wall rendering — no sightline/rigging/throw math uses it yet
- Aisle counts are adjustable per layout, but positions are always evenly spaced — not draggable
- 3D view is presentational: no orbit/zoom (rotation slider only), chairs sort by center depth so rare overlap artifacts can appear at stage edges
- No persistence — refresh resets everything
