# Geordi Task — Mission Control Dashboard v3 Redesign

## Workspace / Repo
- Work directly in: `~/WORK/GINA/mission-control/dashboard/`
- Push to: `ginasreekumar/mission-control-dashboard`

## Coding Tool Order (STRICT)
1. **Amp first** — architecture/high-risk decisions (Smart mode only)
2. **OpenCode second** — primary implementation
3. **KiloCode third** — fallback/overflow

Do not use local Qwen/Ollama.
Do not reorder unless Gina + Srijit approve.
Include runtime trace in handoff.

## Updated direction from Srijit
Ignore Builderz for now.
Use the image/reference Srijit provided as the primary visual target.

The goal is to **copy the layout feel and overall look** from that reference image much more closely.
This is not about tiny polish. It is about making our dashboard feel like that design language.

## Main requirements

### 1) Match the provided reference layout more closely
Focus on:
- overall page composition
- stronger control-plane feel
- tighter hierarchy
- better panel arrangement
- more intentional use of desktop space
- cleaner and more premium surfaces

### 2) Overview page redesign
The overview page should feel clearly redesigned, not just slightly cleaned up.
Aim for:
- better top-level summary area
- more structured multi-panel layout
- stronger grouping of information
- denser but still readable desktop view

### 3) Sidebar / navigation
Keep improving the desktop sidebar so it feels deliberate and polished.

### 4) Calendar / task area
Keep the calendar integrated and visually aligned with the rest of the redesign.

### 5) Add visible version/build identifier on the UI
Add a clear version label on the Mission Control page so we can verify what build we are looking at.
Examples:
- `v0.3.0`
- `Build 2026-03-18-1`
- commit short SHA if available

Requirements for version label:
- visible on the app UI
- easy to spot but not obnoxious
- should help confirm that Vercel / repo / deployed page are actually linked

### 6) Keep honesty about data realism
Do not fake live state if data is still static.
If still static/demo, label it tastefully.

## Deliverables
- Updated dashboard code
- Commit and push to `main`
- Handoff summary must include:
  - what changed visually
  - whether the version label was added and where
  - what still remains rough
  - whether live-data limitations still remain
  - runtime trace
