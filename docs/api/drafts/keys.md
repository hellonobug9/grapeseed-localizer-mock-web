# Key form screen API

Draft endpoint contracts for the `/keys/new` and `/keys/:id/edit` screens, written from the current UI. One file = one Jira ticket. Not sent to BE yet.
After BE agrees, move each endpoint into `docs/api/<domain>.md` with a status line, then delete this file.

| Endpoint                              | Used by                                                     |
| ------------------------------------- | ----------------------------------------------------------- |
| `GET /api/keys/{keyId}`               | Edit: key details, audit panel, translations                |
| `POST /api/projects/{id}/keys`    | New: *Save key*, *Save & add another*                       |
| `PUT /api/keys/{keyId}`               | Edit: *Save changes*                                        |
| `GET /api/projects/list`          | New: *Project* select and its languages (Projects ticket) |
| `GET /api/projects/{id}/modules`  | New: *Module* select (Project details ticket)              |
| `GET /api/languages`                  | Language rows: name, native name (Projects ticket)      |

Not in this ticket: *Upload JSON* (Upload ticket).

**Shared rules**

- Times are ISO 8601 UTC strings.
- *Module*: every key belongs to one module of its project; key names are unique within a module.
- The form shows English (the source, required) plus the project's target languages.
- Admin and Developer can create keys and change everything on a key.
- A Comtor can only change texts in the languages assigned to them, and not while the project is `Locked`. They see English plus their assigned languages.
- **Not in the DB yet:** `format`, `description`, `maxLength` and `createdBy` need new columns on `text_items`. `updatedAt` / `updatedBy` only cover translations today: changes to the English text are not recorded. `createdAt` is empty on older keys and needs a backfill.
- Enums are numbers in requests and responses; values are listed under **Enums**. Enums BE already has keep their C# values; new ones start at 1, like most BE enums.
- Error bodies follow the shared error format (Foundation ticket).

**Enums**

```ts
enum KeyFormat { Label = 1, LongText = 2 }
```

## `GET /api/keys/{keyId}`

Used by: `/keys/:id/edit` (breadcrumb, *Key details*, audit panel, *Translations*).

**Request:** No parameters.

**Response:** `200 OK`

```ts
type KeyDetail = {
  id: number;
  project: {
    id: number;
    name: string;
  }; // Breadcrumb; Project select, read-only when editing.
  module: {
    id: number;
    name: string;
  }; // Module select, read-only when editing.
  key: string; // e.g. "checkout.button.pay_now". Read-only when editing.
  format: KeyFormat; // Content type: one-line fields per language, or a long text / HTML editor with one tab per language.
  description: string | null; // Context for translators.
  maxLength: number | null; // Label only; null = no limit.

  createdAt: string; // Audit panel: Created.
  createdBy: string; // Display name.
  updatedAt: string; // Audit panel: Last updated; latest change to the key or any of its texts.
  updatedBy: string; // Display name.

  texts: {
    languageCode: string;
    text: string | null; // null if not written yet. HTML for LongText.
  }[]; // English first, then the project's target languages by name. "N of M languages filled".
};
```

**Errors:** `403` no access to the key's project · `404` key not found.

**Example response:**

```json
{
  "id": 1024,
  "project": { "id": 1, "name": "School site" },
  "module": { "id": 12, "name": "auth" },
  "key": "auth.login.title",
  "format": 1,
  "description": "Heading on the sign-in page",
  "maxLength": 40,
  "createdAt": "2026-10-26T09:12:00Z",
  "createdBy": "Logan Le",
  "updatedAt": "2026-10-27T02:30:00Z",
  "updatedBy": "An Nguyen",
  "texts": [
    { "languageCode": "en", "text": "Sign in to GrapeSEED" },
    { "languageCode": "ko", "text": null },
    { "languageCode": "vi", "text": "Đăng nhập vào GrapeSEED" }
  ]
}
```

## `POST /api/projects/{id}/keys`

Used by: `/keys/new` (*Save key*, *Save & add another*).

Creates a key in a module of the project with its English text and any translations already filled in.

**Request:**

```ts
type CreateKeyRequest = {
  moduleId: number; // Required. A module of the project (GET /api/projects/{id}/modules, Project details ticket).
  key: string; // Required, unique in the module. Lowercase letters, digits and underscores, separated by dots, e.g. "checkout.button.pay_now".
  format: KeyFormat;
  description: string | null; // Context for translators.
  maxLength: number | null; // Label only, at least 1; null = no limit.
  texts: {
    languageCode: string; // English or a target language of the project.
    text: string; // "" = not translated yet.
  }[]; // Every language shown in the form. English is required and cannot be "".
};
```

**Response:** `201 Created`

```ts
type CreateKeyResponse = {
  id: number; // Only the id is needed.
};
```

**Errors:** `400` field errors on `moduleId` (not a module of the project), `key` (format), `maxLength` or `texts` (English missing, unknown language) · `403` no permission · `404` project not found · `409` `key` already exists in the module (field error on `key`).

**Example request:** `POST /api/projects/1/keys`

```json
{
  "moduleId": 12,
  "key": "auth.login.forgot_password",
  "format": 1,
  "description": "Link under the sign-in form",
  "maxLength": 40,
  "texts": [
    { "languageCode": "en", "text": "Forgot your password?" },
    { "languageCode": "ko", "text": "" },
    { "languageCode": "vi", "text": "Quên mật khẩu?" }
  ]
}
```

**Example response:**

```json
{ "id": 1025 }
```

## `PUT /api/keys/{keyId}`

Used by: `/keys/:id/edit` (*Save changes*).

Saves the key details and its texts. The key name, project and module cannot be changed.

**Request:**

```ts
type UpdateKeyRequest = {
  format: KeyFormat;
  description: string | null;
  maxLength: number | null; // Label only, at least 1; null = no limit.
  texts: {
    languageCode: string;
    text: string; // "" clears the translation. English cannot be "".
  }[]; // Every language shown in the form; languages not listed are unchanged.
};
```

**Response:** `204 No Content`

**Errors:** `400` field errors on `maxLength` or `texts` · `403` no permission, or a Comtor changing key details or a language not assigned to them · `404` key not found · `409` the project is `Locked` and the user is a Comtor.

**Example request:** `PUT /api/keys/1024`

```json
{
  "format": 1,
  "description": "Heading on the sign-in page",
  "maxLength": 40,
  "texts": [
    { "languageCode": "en", "text": "Sign in to GrapeSEED" },
    { "languageCode": "ko", "text": "GrapeSEED에 로그인" },
    { "languageCode": "vi", "text": "Đăng nhập vào GrapeSEED" }
  ]
}
```

## `GET /api/projects/list`, `GET /api/languages`

Used by: `/keys/new` (*Project* select; which language rows to show), both screens (language name and native name on each row).

Same endpoints as in the Projects ticket. `GET /api/languages` includes `nativeName` (e.g. "Tiếng Việt"), shown next to the language code on each row.
