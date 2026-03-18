# Geordi Task — Mission Control Dashboard v2

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

## New fixes requested by Srijit

### 1) Better “Last activity” display
When the UI shows a timestamp like `20:15:00`, also show relative time, for example:
- `20:15:00 · 12 min ago`
- `20:15:00 · yesterday`
- `20:15:00 · 2 days ago`

Make this human-friendly everywhere it appears.

### 2) Fix dashboard updating
Current dashboard refresh/update behavior is not working properly.
Fix it so the dashboard actually updates reliably.
Check:
- auto-refresh behavior
- manual refresh behavior
- stale client-side caching issues
- API/data fetch flow

## Continue the rest of the dashboard buildout
Srijit still wants the broader v2 polish done:

### Required UI work
1. **Desktop left sidebar / nav rail**
   - persistent sidebar in web view
   - icons + labels
   - active state highlighting

2. **Calendar view with tasks**
   - weekly/monthly task calendar
   - task cards/events visible on calendar
   - click into task details

3. **More polished visual design**
   - closer to Builderz Mission Control / Linear feel
   - cleaner spacing
   - stronger typography hierarchy
   - better cards, shadows, surfaces
   - overall more finished/professional

## Deliverables
- Update the dashboard code
- Commit and push to `main`
- Reply with:
  - what changed
  - whether refresh issue is fixed
  - runtime trace (`Amp → OpenCode`, etc.)
