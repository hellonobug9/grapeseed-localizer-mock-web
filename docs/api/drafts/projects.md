# Projects screen API

Draft endpoint contracts for the `/projects` screen, written from the current UI. One file = one Jira ticket. Not sent to BE yet.
After BE agrees, move each endpoint into `docs/api/<domain>.md` with a status line, then delete this file.

| Endpoint                                     | Used by                                                |
| -------------------------------------------- | ------------------------------------------------------ |
| `GET /api/projects/list`                 | Table, page header, drawer header, stats and lock      |
| `GET /api/projects/{id}/languages`       | Drawer, *By language*                                  |
| `GET /api/languages`                         | Languages column tooltip, drawer *Languages to translate*, *New project* |
| `POST /api/projects`                     | *New project* dialog                               |
| `PUT /api/projects/{id}/languages`       | Drawer, *Save languages*                               |
| `PUT` / `DELETE /api/projects/{id}/lock` | Row menu, drawer *Translation lock*                    |

**Shared rules**

- Times are ISO 8601 UTC strings.
- *Target languages* are the languages enabled for a project, excluding the source language. Creating a project or saving its languages needs at least one, but deleting a language (Languages ticket) can still leave a project with none, so every endpoint handles that case.
- English (`en`) is the source language and never a target language.
- Languages are identified by `code` in every path, query and body (`languageCode`, `languageCodes`); BE's numeric language ids are not used in the API.
- *Untranslated*: the key has no translation in that language, or it is empty or the same as English after trimming. Every count on this screen uses this rule.
- Only Admin and Developer can create projects, change languages and lock; other roles only view. FE hides these actions based on the current user's role (Foundation ticket).
- *Lock status*: `Scheduled` while `now < startAt`, `Locked` while `startAt <= now` and (`endAt` is `null` or `now < endAt`), otherwise `Open`. `GET /api/projects/list` and `GET /api/projects/{id}` return it as `lockState`, computed when the response is built. Other endpoints return only the lock window and FE applies this rule.
- Error bodies follow the shared error format (Foundation ticket).

## `GET /api/projects/list`

Used by: `/projects` (table, page header totals, drawer header, stats and lock section).

**Request:** No parameters. Returns every project the current user can see, sorted by `name`, without pagination. Search and the All/Open/Locked filter run on the client.

**Response:** `200 OK`, JSON array.

```ts
type ProjectListItem = {
  id: number; // Used in /projects/{id} links and the calls below.
  name: string; // Table, drawer header; searchable. FE picks the project icon and color from id.
  targetLanguageCodes: string[]; // e.g. ["ko", "vi"]; [] if none. FE takes names from GET /api/languages. Languages column (count, names in the tooltip); pre-checked boxes in Languages to translate.

  totalKeys: number; // Page header total, "translated / total" under the coverage bar, drawer Total keys.
  untranslatedKeyCount: number; // Keys untranslated in at least one target language. Drawer Untranslated keys; translated = totalKeys − untranslatedKeyCount.
  untranslatedStringCount: number; // Untranslated key × target language pairs. FE computes coverage from it over totalKeys × number of target languages: coverage bar, drawer Overall coverage.

  lastTranslatedAt: string | null; // Latest create/update of a target-language translation, including imports; null if never. Last translated column, drawer.
  lastTranslatedBy: string | null; // Display name; null if never. "by …" in the Last translated tooltip.

  lockState: "Open" | "Locked" | "Scheduled"; // Status pill, Open/Locked filter, which lock action the row menu and drawer offer.
  lockStartAt: string | null; // When the lock starts; in the future when Scheduled. null when Open.
  lockEndAt: string | null; // Exclusive; null = locked until someone unlocks it, or Open.
  lockedBy: string | null; // Display name of who locked or scheduled it; null when Open. Status tooltip, drawer lock summary.
};
```

**Example response:**

```json
[
  {
    "id": 3,
    "name": "Connect site",
    "targetLanguageCodes": ["ko", "vi"],
    "totalKeys": 640,
    "untranslatedKeyCount": 120,
    "untranslatedStringCount": 135,
    "lastTranslatedAt": "2026-10-05T03:20:00Z",
    "lastTranslatedBy": "An Nguyen",
    "lockState": "Scheduled",
    "lockStartAt": "2026-10-31T17:00:00Z",
    "lockEndAt": "2026-11-07T17:00:00Z",
    "lockedBy": "Binh Le"
  }
]
```

## `GET /api/projects/{id}/languages`

Used by: `/projects` (drawer, *By language* section). Loaded when the drawer opens.

**Request:** No parameters.

**Response:** `200 OK`, JSON array: the project's target languages; `[]` shows "No target languages configured yet." FE takes names and native names from `GET /api/languages` and `totalKeys` from the project.

```ts
type ProjectLanguageProgress = {
  code: string; // Link to /projects/{id}?lang={code}.
  untranslatedCount: number; // Keys untranslated in this language. "N missing"; translated = totalKeys − untranslatedCount; the link opens the Missing filter when > 0.
  lastTranslatedAt: string | null; // Latest create/update in this language, including imports; null shows "Never".
};
```

**Errors:** `403` no access to the project · `404` project not found.

**Example response:**

```json
[
  { "code": "ko", "untranslatedCount": 0, "lastTranslatedAt": "2026-10-20T07:45:00Z" },
  { "code": "vi", "untranslatedCount": 120, "lastTranslatedAt": "2026-10-05T03:20:00Z" }
]
```

## `GET /api/languages`

Used by: `/projects` (drawer *Languages to translate*, *New project* dialog). BE may reuse an existing endpoint that returns this data.

**Request:** No parameters. Returns every language a project can be translated into, plus the source language, sorted by `name`.

**Response:** `200 OK`, JSON array.

```ts
type Language = {
  code: string; // e.g. "vi"; the value sent in languageCodes.
  name: string; // English name; checkbox label.
  nativeName: string; // e.g. "Tiếng Việt". Key form, next to the language code.
};
```

**Example response:**

```json
[
  { "code": "en", "name": "English", "nativeName": "English" },
  { "code": "ko", "name": "Korean", "nativeName": "한국어" },
  { "code": "vi", "name": "Vietnamese", "nativeName": "Tiếng Việt" }
]
```

## `POST /api/projects`

Used by: `/projects` (*New project* dialog).

**Request:**

```ts
type CreateProjectRequest = {
  name: string; // Required, unique.
  languageCodes: string[]; // Target languages, at least one; English is always the source and is not sent.
};
```

**Response:** `201 Created`

```ts
type CreateProjectResponse = {
  id: number; // FE then refetches GET /api/projects/list.
};
```

**Errors:** `400` field errors on `name` or `languageCodes`, shown under the field · `403` no permission · `409` `name` already exists (field error on `name`).

**Example request:**

```json
{
  "name": "School site",
  "languageCodes": ["vi"]
}
```

**Example response:**

```json
{ "id": 16 }
```

## `PUT /api/projects/{id}/languages`

Used by: `/projects` (drawer, *Languages to translate* → *Save languages*).

Replaces the project's target languages. A removed language is hidden from Comtors and downloads; its translations are kept and come back if it is enabled again.

**Request:**

```ts
type UpdateProjectLanguagesRequest = {
  languageCodes: string[]; // The full new set of target languages, at least one; excludes English.
};
```

**Response:** `204 No Content`. FE then refetches `GET /api/projects/list` and `GET /api/projects/{id}/languages`.

**Errors:** `400` empty list or unknown code · `403` no permission · `404` project not found.

**Example request:** `PUT /api/projects/3/languages`

```json
{ "languageCodes": ["ko", "vi"] }
```

## `PUT /api/projects/{id}/lock`, `DELETE /api/projects/{id}/lock`

Used by: `/projects` (row menu *Lock now* / *Unlock* / *Cancel scheduled lock*, drawer *Translation lock*).

While a project is locked, Comtors cannot edit its translations. `PUT` locks now or schedules a lock. `DELETE` unlocks the project or cancels a scheduled lock; no request body.

The form picks whole days, not times. FE converts them in the user's time zone, so BE only compares instants.

**Request (`PUT`):**

```ts
type LockRequest = {
  startAt: string | null; // null = lock now; otherwise the start of the first locked day.
  endAt: string | null; // Exclusive: the start of the day after the last locked day. null = until someone unlocks it.
};
```

**Rules:**

- A lock becomes `Locked` at `startAt` and `Open` again at `endAt` on its own, with no manual unlock.
- `endAt` must be later than both `startAt` and the current time.
- `PUT` is only allowed when the project is `Open`.
- `DELETE` on a project that is already `Open` does nothing and still returns `204`.

**Response (both):** `204 No Content`. FE then refetches `GET /api/projects/list`.

**Errors (`PUT`):** `400` invalid `startAt` / `endAt` · `403` no permission · `404` project not found · `409` project is already `Locked` or `Scheduled`, e.g. someone else locked it first.

**Errors (`DELETE`):** `403` no permission · `404` project not found.

**Example requests:** `PUT /api/projects/3/lock`

Lock now, until someone unlocks it:

```json
{ "startAt": null, "endAt": null }
```

A user in UTC+7 schedules a lock for 1–7 Nov 2026:

```json
{ "startAt": "2026-10-31T17:00:00Z", "endAt": "2026-11-07T17:00:00Z" }
```
