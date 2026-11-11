# Project details screen API

Draft endpoint contracts for the `/projects/:id` screen, written from the current UI. One file = one Jira ticket. Not sent to BE yet.
After BE agrees, move each endpoint into `docs/api/<domain>.md` with a status line, then delete this file.

| Endpoint                                         | Used by                                              |
| ------------------------------------------------ | ---------------------------------------------------- |
| `GET /api/projects/{id}`                     | Page header, lock callout, *Last translated* card    |
| `GET /api/projects/{id}/languages`           | Language picker, *Languages* tab, *Untranslated* card |
| `GET /api/languages`                         | Language names and native names (Projects ticket)     |
| `GET /api/projects/{id}/modules`             | *Translations* tab: modules list, module bar; *Total keys*, *New keys* cards |
| `GET /api/projects/{id}/keys`                | *Translations* tab: keys table, pager                |
| `PUT /api/projects/{id}/translations/{languageCode}` | *Translations* tab: inline *Save*, *Save all*  |
| `DELETE /api/keys/{keyId}`                       | *Translations* tab: row menu *Delete key*            |

Not in this ticket: TEST/LIVE cards, *Publish* and *Download* (Publish & download ticket); *Upload JSON*, *Add key* and the full key editor (Keys ticket).

**Shared rules**

- Times are ISO 8601 UTC strings.
- *Target languages*, *untranslated*: same rules as the Projects ticket.
- *New key*: created in the last 7 days.
- *Module*: every key belongs to one module of its project.
- *Lock status*: returned as `lockState`, same rule as in the Projects ticket.
- Admin and Developer can edit any translation, even while the project is locked, and delete keys.
- A Comtor only sees and edits the languages assigned to them, and cannot edit while the project is `Locked`. Every language list below is filtered the same way for a Comtor.
- **Not in the DB yet:** key `format` and `description`, and the `maxLength` behind `TooLong`, need new columns on `text_items` (Key form ticket). Key `updatedAt` / `updatedBy` only cover translations today: changes to the English text are not recorded.
- Enums are numbers in requests and responses; values are listed under **Enums**. Enums BE already has keep their C# values; new ones start at 1, like most BE enums.
- Error bodies follow the shared error format (Foundation ticket).

**Enums**

```ts
enum KeyFormat { Label = 1, LongText = 2 } // Same as in the Key form ticket.
enum KeyStatusFilter { All = 1, Untranslated = 2, Translated = 3, New = 4 }
enum SaveTranslationError { NotFound = 1, TooLong = 2 }
```

## `GET /api/projects/{id}`

Used by: `/projects/:id` (breadcrumb, page header, locked / scheduled callout, *Last translated* card).

**Request:** No parameters.

**Response:** `200 OK`

```ts
type ProjectDetail = {
  id: number;
  name: string; // Breadcrumb, page title. FE picks the project icon and color from id.
  lastTranslatedAt: string | null; // Same as in GET /api/projects/list. Last translated card.
  lastTranslatedBy: string | null;

  lockState: "Open" | "Locked" | "Scheduled"; // Same as in GET /api/projects/list. Locked / scheduled callout.
  lockStartAt: string | null; // Same as in GET /api/projects/list. Callout summary.
  lockEndAt: string | null;
  lockedBy: string | null;
};
```

FE computes the rest of the header and KPI cards from the other calls on this page:

- Target languages ("N languages", language picker): the codes in `GET /api/projects/{id}/languages`.
- Total keys, New keys, Translations tab count: sums of `keyCount` and `newKeyCount` in `GET /api/projects/{id}/modules`.
- Untranslated card and its coverage bar: the sum of `untranslatedCount` in `GET /api/projects/{id}/languages`, over total keys × number of target languages.

**Errors:** `403` no access to the project · `404` project not found (shows *Project not found*).

**Example response:**

```json
{
  "id": 1,
  "name": "School site",
  "lastTranslatedAt": "2026-10-20T07:45:00Z",
  "lastTranslatedBy": "An Nguyen",
  "lockState": "Locked",
  "lockStartAt": "2026-10-27T00:00:00Z",
  "lockEndAt": null,
  "lockedBy": "Binh Le"
}
```

## `GET /api/projects/{id}/languages`

Used by: `/projects/:id` (language picker with coverage %, *Languages* tab).

Same endpoint as in the Projects ticket. Names and native names (next to the name in the Languages tab) come from `GET /api/languages`.

## `GET /api/projects/{id}/modules`

Used by: `/projects/:id` (*Translations* tab: modules list, module bar, *Select a module* hint, `?module=` check).

**Request:** `languageCode` (query, optional): the language picked in the toolbar; omitted when the project has no target languages.

**Response:** `200 OK`, JSON array sorted by `name`; `[]` if the project has no modules.

```ts
type ModuleItem = {
  id: number; // Sent as moduleId to GET keys.
  name: string; // e.g. "common". Modules list, module bar.
  keyCount: number; // Badge in the list, "N keys" in the module bar.
  untranslatedCount: number; // Keys untranslated in languageCode; 0 if it is omitted. "N untranslated" / "All translated".
  newKeyCount: number; // "N new".
};
```

**Errors:** `400` `languageCode` is not a target language of the project · `403` no access to the project or language · `404` project not found.

**Example request:** `GET /api/projects/1/modules?languageCode=vi`

**Example response:**

```json
[
  { "id": 12, "name": "auth", "keyCount": 120, "untranslatedCount": 8, "newKeyCount": 3 },
  { "id": 13, "name": "dashboard", "keyCount": 45, "untranslatedCount": 0, "newKeyCount": 0 }
]
```

## `GET /api/projects/{id}/keys`

Used by: `/projects/:id` (*Translations* tab: keys table, pager). Called once a module is picked or a search / status filter is set.

**Request (query):**

```ts
type KeyListQuery = {
  languageCode?: string; // Language picked in the toolbar; omitted when the project has no target languages.
  moduleId?: number; // Only keys in this module; omitted = all modules.
  q?: string; // Case-insensitive "contains" on the key, its English text, or its text in languageCode.
  status?: KeyStatusFilter; // Default All. Untranslated / Translated are checked in languageCode.
  page?: number; // 1-based, default 1.
  pageSize?: number; // Default 25.
};
```

**Response:** `200 OK`

```ts
type KeyListResponse = {
  items: {
    id: number; // Inline save, delete, link to /keys/{id}/edit.
    key: string; // Full key, e.g. "auth.login.title".
    description: string | null; // Shown under the key.
    format: KeyFormat; // LongText: Long tag, shown as plain text, edited on the key page instead of inline.
    isNew: boolean; // NEW tag.
    sourceText: string; // English text; HTML for LongText.
    translation: string | null; // Text in languageCode; null if missing or empty ("Not translated"), or if languageCode is omitted.
    updatedAt: string; // Latest change to the key, its English text or its languageCode translation. Updated column.
    updatedBy: string; // Display name of who made that change.
  }[]; // New keys first, then by key.
  total: number; // Keys matching the filters across all pages; pager.
};
```

**Errors:** `400` invalid query value · `403` no access to the project or language · `404` project not found.

**Example request:** `GET /api/projects/1/keys?languageCode=vi&moduleId=12&status=2&page=1&pageSize=25` (Untranslated)

**Example response:**

```json
{
  "items": [
    {
      "id": 1024,
      "key": "auth.login.title",
      "description": "Heading on the sign-in page",
      "format": 1,
      "isNew": true,
      "sourceText": "Sign in to GrapeSEED",
      "translation": null,
      "updatedAt": "2026-10-26T09:12:00Z",
      "updatedBy": "Logan Le"
    }
  ],
  "total": 8
}
```

## `PUT /api/projects/{id}/translations/{languageCode}`

Used by: `/projects/:id` (*Translations* tab: *Save* on an inline editor, which sends one change, and *Save all* in the pending changes bar).

Saves translations of several keys in one language. Valid changes are saved even when others fail; the response lists the ones that failed. A saved change updates the key's `updatedAt` and `updatedBy`.

**Request:**

```ts
type SaveTranslationsRequest = {
  changes: {
    keyId: number;
    text: string; // Trimmed by FE. "" clears the translation, so the key becomes untranslated.
  }[]; // 1–100 items, no duplicate keyId.
};
```

**Response:** `200 OK`

```ts
type SaveTranslationsResponse = {
  failed: {
    keyId: number;
    code: SaveTranslationError; // NotFound: the key was deleted. TooLong: longer than the key's maxLength.
  }[]; // [] when every change was saved; every change not listed here was saved.
};
```

**Errors:** `400` no changes, more than 100, a duplicate `keyId`, or `languageCode` is not a target language of the project · `403` no access to the project, or a Comtor not assigned to `languageCode` · `404` project not found · `409` the project is `Locked` and the user is a Comtor; nothing is saved.

**Example request:** `PUT /api/projects/1/translations/vi`

```json
{
  "changes": [
    { "keyId": 1024, "text": "Đăng nhập vào GrapeSEED" },
    { "keyId": 1025, "text": "Quên mật khẩu?" }
  ]
}
```

**Example response:**

```json
{
  "failed": [{ "keyId": 1025, "code": 1 }]
}
```

## `DELETE /api/keys/{keyId}`

Used by: `/projects/:id` (*Translations* tab: row menu *Delete key*, after confirmation).

Deletes the key with its English text and all its translations. No request body.

**Response:** `204 No Content`

**Errors:** `403` no permission · `404` key not found.
