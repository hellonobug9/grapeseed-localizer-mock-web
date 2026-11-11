# Publish & download API

Draft endpoint contracts for the TEST/LIVE cards, *Publish* dialog, *Download* menu and *Export* dialog on the `/projects/:id` screen, written from the current UI. One file = one Jira ticket. Not sent to BE yet.
After BE agrees, move each endpoint into `docs/api/<domain>.md` with a status line, then delete this file.

| Endpoint                                              | Used by                                                   |
| ----------------------------------------------------- | --------------------------------------------------------- |
| `GET /api/projects/{id}/environments`             | TEST/LIVE cards, *Publish* dialog *Changed keys*          |
| `POST /api/projects/{id}/environments/{env}/publish` | *Publish* dialog, *Publish to TEST* / *Publish to LIVE* |
| `GET /api/projects/{id}/export/{languageCode}`    | *Download* menu, one language                             |
| `POST /api/projects/{id}/export`                  | *Download* menu *All languages*, *Export* dialog          |
| `GET /api/projects/{id}/modules`, `GET /api/projects/{id}/languages` | *Publish* dialog *New keys* (sum of `newKeyCount`), *Untranslated* (sum of `untranslatedCount`) (Project details ticket) |

**Shared rules**

- Times are ISO 8601 UTC strings.
- *Untranslated*, *untranslated string*: same rules as the Projects and Project details tickets.
- `env` is an `Environment` number (1 = TEST, 2 = LIVE), in the path too. Publishing makes the project's current translations available to that environment; LIVE reaches end users immediately.
- Only Admin and Developer can publish. Every role can download; a Comtor only gets English plus the languages assigned to them.
- Exported files are flat JSON: one object of `"key": "text"`, keys sorted, English and target languages only. LongText values are HTML strings. The same format is accepted by *Upload JSON* (Upload ticket).
- BE builds the export files; FE only saves them. FE calls the export endpoints with the Bearer token, reads the response as a blob and saves it under the file name it chose, so a plain download link is not used. Errors from the export endpoints still come back as JSON in the shared error format, not as a file.
- Enums are numbers in requests and responses; values are listed under **Enums**. Enums BE already has keep their C# values; new ones start at 1, like most BE enums.
- Error bodies follow the shared error format (Foundation ticket).

**Enums**

```ts
enum Environment { Test = 1, Prod = 2 } // EnvironmentEnum in BE; Prod is LIVE in the UI.
```

## `GET /api/projects/{id}/environments`

Used by: `/projects/:id` (TEST and LIVE cards; *Changed keys* in the *Publish* dialog).

**Request:** No parameters.

**Response:** `200 OK`, JSON array with one item per environment, TEST first.

```ts
type ProjectEnvironment = {
  environment: Environment;
  publishedAt: string | null; // "Published {time ago} by {user}"; null if never published.
  publishedBy: string | null; // Display name; null if never published.
  changedKeyCount: number; // Keys created or changed (key details or any text) since publishedAt; every key if never published. Publish dialog Changed keys.
};
```

**Errors:** `403` no access to the project · `404` project not found.

**Example response:**

```json
[
  { "environment": 1, "publishedAt": "2026-10-30T08:10:00Z", "publishedBy": "Logan Le", "changedKeyCount": 6 },
  { "environment": 2, "publishedAt": "2026-10-20T02:00:00Z", "publishedBy": "Binh Le", "changedKeyCount": 38 }
]
```

## `POST /api/projects/{id}/environments/{env}/publish`

Used by: `/projects/:id` (*Publish* dialog, *Publish to TEST* / *Publish to LIVE*).

Publishes the project's current translations to `env`. The *QA has verified the TEST build* checkbox for LIVE is only checked on the client and is not sent.

**Request:**

```ts
type PublishRequest = {
  note: string | null; // Release note; optional, at most 500 characters.
  useEnglishFallback: boolean; // true: untranslated strings are published with the English text. false: they are left out, so the client app shows its own fallback.
};
```

**Response:** `204 No Content`. FE then refetches `GET /api/projects/{id}/environments`.

**Errors:** `400` unknown `env` or `note` too long · `403` no permission · `404` project not found.

**Example request:** `POST /api/projects/1/environments/2/publish` (LIVE)

```json
{ "note": "Checkout page copy for the November release", "useEnglishFallback": true }
```

## `GET /api/projects/{id}/export/{languageCode}`

Used by: `/projects/:id` (*Download* menu, one language).

Downloads one language as `{languageCode}.json`, including keys with no text yet.

**Request:** No parameters.

**Response:** `200 OK`, `Content-Type: application/json`, `Content-Disposition: attachment; filename="{languageCode}.json"`.

Keys with no text in this language have `""` as their value. A text that is the same as English is exported as it is; the *untranslated* rule is only for counts.

**Errors:** `403` no access to the project or, for a Comtor, the language · `404` project not found, or the language is not English or a target language of the project.

**Example response:** `GET /api/projects/1/export/vi`

```json
{
  "auth.login.title": "Đăng nhập vào GrapeSEED",
  "checkout.button.pay_now": "Thanh toán ngay",
  "home.title.welcome": ""
}
```

## `POST /api/projects/{id}/export`

Used by: `/projects/:id` (*Download* menu *All languages*; *Export* dialog).

Downloads several languages as one zip archive with one JSON file per language. *All languages* sends English and every target language with the default file names, the default archive name and `includeUntranslated: true`.

**Request:**

```ts
type ExportRequest = {
  languages: {
    code: string; // English or a target language of the project.
    fileName: string; // Required, unique within the archive. Default "{code}.json"; FE strips \ / : * ? " < > |.
  }[]; // At least one.
  archiveName: string; // Required, without ".zip". Default "{project name}-translations", with the name lowercased and spaces turned into "-"; same characters stripped.
  includeUntranslated: boolean; // true: keys with no text in that language are included with "" as their value. false: they are left out of that language's file. A text that is the same as English is always exported.
};
```

BE checks `fileName` and `archiveName` itself instead of relying on FE: not empty, no `/` or `\`, no `..`, no control characters, and not a reserved device name such as `CON` or `NUL`. Otherwise it returns `400` on that field.

**Response:** `200 OK`, `Content-Type: application/zip`, `Content-Disposition: attachment; filename="{archiveName}.zip"`.

**Errors:** `400` field errors on `languages` (empty, unknown or not in the project, duplicate file name), `fileName` or `archiveName` · `403` no access to the project or, for a Comtor, one of the languages · `404` project not found.

**Example request:** `POST /api/projects/1/export`

```json
{
  "languages": [
    { "code": "en", "fileName": "en.json" },
    { "code": "vi", "fileName": "vi-VN.json" }
  ],
  "archiveName": "school-site-translations",
  "includeUntranslated": false
}
```
