---
description: Check BE's API notes for a ticket against the current FE, draft the final contract to send back, then record it in docs/api
argument-hint: <TICKET-KEY> [paste ticket text / BE notes]
---

# API contract for a ticket

Input: `$ARGUMENTS`, a ticket key (e.g. `PRE-12204`), optionally followed by pasted ticket text, BE notes or a draft contract.

The user is the FE team lead. Goal: decide what FE needs from each endpoint in the ticket, send BE one final contract, and keep `docs/api/` in sync.

## Rules

- FE only. Never read or analyse backend source code. Do not change app code in this command; the only files you may write are `docs/api/*.md`, and only in step 6.
- Ground every field you ask for in a concrete UI element (`file:line`). If no UI uses it, don't ask for it.
- Don't invent business rules. When you have to pick something (a rule, a threshold, a validation, a permission), list it under "Tôi tự quyết" so the user can check it before sending.
- A field the ticket requires but the current UI doesn't render (e.g. commented-out code) is not dropped silently. Flag it for Product.
- Whether BE reuses an existing endpoint is BE's call. Describe what FE needs, not how BE builds it.
- Don't over-engineer: no pagination, query params, per-row permission flags or extra fields without a concrete need.
- Follow the conventions already in `docs/api/*.md` (ISO 8601 UTC times, string enums, explicit meaning of `null`, 0–100 percentages, `[]` for empty lists). Don't contradict an agreed contract; if a new need changes one, say so explicitly.

## Steps

1. **Get the ticket.** If a Jira/Atlassian tool is available, fetch the ticket and its comments. Otherwise use the pasted text. If nothing was pasted, ask the user to paste the ticket description and BE notes, then stop.
2. **Read context:** `docs/api/*.md` (existing contracts and their status), `docs/api_layer.md`, `CLAUDE.md`.
3. **Map FE needs.** Find the screens in scope through the routes in `src/App.tsx` and `src/pages/`. Read the page, its components, `src/types/`, the mock data in `src/data/`, and locale copy in `src/locales/en.json` that implies behaviour (hints, warnings, toasts). For each UI element, note the data it needs.
4. **Compare BE notes with FE needs**, per endpoint:
   - Missing for FE, unused by FE, or unclear: scale, formula, null meaning, timezone, enum values, defaults, validation, sorting.
   - Mutations: request per mode, validation, a response that lets FE update the UI (or FE refetches), errors (`400` / `403` / `404` / `409`), repeated or concurrent actions.
   - Permissions per role: only what the ticket states.
   - Consistency across endpoints: a value from a cached list combined with fresh data from another call can disagree, so prefer self-contained responses.
   - Heavy per-item detail goes into a separate endpoint loaded on demand, not into a list.
5. **Reply in Vietnamese**, short, in this order:
   1. Kết luận in 1–2 sentences: is the contract enough, and what important piece is missing.
   2. A short table: UI element → field → ✅ / ❌ / ❓.
   3. **Tôi tự quyết**: choices the user should verify before sending.
   4. **Cần Product/BE trả lời**: only questions that block FE, if any.
   5. The ticket comment in English (format below), ready to paste.
6. **Update docs only after the user confirms** the comment was posted or BE agreed. Write to `docs/api/<domain>.md`: one file per domain; create it with the same header as the existing files if it is missing. Each endpoint section gets:
   - A status line: `Proposed on <TICKET> on <YYYY-MM-DD>, pending BE confirmation.` or `Agreed with BE on <YYYY-MM-DD> (<TICKET>).`
   - `Used by: <route> (<screen area>)`.
   - Exactly the content the user posted. Keep one ticket's endpoints together. Don't commit.

## Ticket comment format

English, per endpoint, nothing more:

````md
### <n>. <Title>

**Endpoint:** `<METHOD> <path>`

<One sentence on what it does.>

**Request:** ← only when there is a body or query params

```ts
type <Name>Request = {
  field: type; // Short note: meaning, format, null meaning.
};
```

<Validation rules in one sentence, if any.>

**Response:** `<status>`

```ts
type <Name> = {
  field: type; // Short note.
};
```

**Errors:** `400` … · `403` … · `404` … ← only the ones that matter

**Example request:** / **Example response:**

```json
{ … realistic values … }
```

<Permission sentence, if the ticket defines it.>
````

- Notes go in the model comments, not in prose.
- No FE implementation details.
- Open questions go in a short **Questions** list at the end, only if needed, never inside the model.
