# AI Guidelines for Build-Buddy Worker App

## Context Engineering Rules (CE)

**CE-1**: Store reusable chunks in `ai_context` table; no inline blobs.
**CE-2**: Filter context by role → only `worker` scope in Worker App.
**CE-3**: Pass UUIDs (e.g., `task_id`) — assistant resolves names server-side.
**CE-4**: Chunk docs ≤ 4 KB; keep prompt < 4 KB pre-expansion (Lovable limit).
**CE-5**: Tag context rows with `lang` for future i18n.

## Prompt Engineering Rules (PE)

**PE-1**: Prompt layout = **System → Role → Context → Instruction**.
**PE-2**: Use declarative imperatives ("Generate a 3-bullet risk summary").
**PE-3**: Request explicit output formats (JSON or Markdown).
**PE-4**: Add token guardrails (`Limit ≤ 250 words`).
**PE-5**: Insert absolute dates server-side—no "today" strings.

## Mobile Requirements

- Must render perfectly at 390 px (iPhone 16 Pro) & 430 px (Pro Max)
- Touch targets ≥ 44 px; respect `env(safe-area-inset-*)`
- Test landscape at 744 px (iPad Mini) & 1366 px (iPad Pro 13")

## Tech Stack

- React 18 + Vite + TypeScript
- Tailwind CSS (+ custom xs 375 px breakpoint)
- Shadcn/UI
- TanStack React-Query
- Supabase JS v2

## Success Criteria

✅ `pnpm dev` → sign in with seeded worker creds  
✅ `/today` lists tasks from `worker.my_tasks_view`  
✅ Checkbox toggles status → toast displayed  
✅ Lighthouse mobile score ≥ 90 (no PWA offline yet)