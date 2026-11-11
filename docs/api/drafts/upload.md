# Upload JSON screen API

Draft endpoint contracts for the `/keys/upload` screen, written from the current UI. One file = one Jira ticket. Not sent to BE yet.
After BE agrees, move each endpoint into `docs/api/<domain>.md` with a status line, then delete this file.

| Endpoint                                 | Used by                                                   |
| ---------------------------------------- | --------------------------------------------------------- |
| `POST /api/projects/{id}/imports`    | *Import translations*                                     |
| `GET /api/projects/list`             | *Project* select (Projects ticket)                |
| `GET /api/languages`                     | *Language of the file* select (Projects ticket)       |

The *Preview* panel is built on the client from the chosen file; no endpoint is needed for it.

**Shared rules**

- One language per file. The file is a JSON object whose values are the texts. Keys may be flat (`"auth.login.title"`) or nested (`{ "auth": { "login": { "title": … } } }`); nested keys are joined with dots.
- Values that are not strings are skipped. Keys that are not valid key names (Key form ticket) are skipped. Texts longer than the key's `maxLength` are skipped.
- An empty string `""` in the file is treated as no translation and never clears an existing one.
- *Untranslated*: same rule as the Projects ticket (missing, empty, or the same as English after trimming).
- New keys can only be added from an English file, because English is required on every key. In a target-language file, keys not yet in the project are skipped in every mode.
- Only Admin and Developer can import, in any language and even while the project is `Locked`. Comtors cannot; they translate in the project instead. FE hides *Upload JSON* for them (Foundation ticket).
- Each import records one `Upload` event in Activity (Activity ticket) with the file name and the number of keys added or changed; skipped keys are not counted.
- **Not in the DB yet:** keys have no `maxLength` until the Key form ticket adds it; until then that check is skipped.
- **Open:** which module a new key from the file goes into. FE suggests the module whose name is the part of the key before the first dot.
- Enums are numbers in requests and responses; values are listed under **Enums**. Enums BE already has keep their C# values; new ones start at 1, like most BE enums.
- Error bodies follow the shared error format (Foundation ticket).

**Enums**

```ts
enum ImportMode { Fill = 1, Overwrite = 2, Update = 3 }
```

## `POST /api/projects/{id}/imports`

Used by: `/keys/upload` (*Import translations*).

Queues an import of one JSON file into a project. FE shows "Import queued" and does not wait for the result; the result shows in Activity.

**Request:** `multipart/form-data`

```ts
type ImportRequest = {
  file: File; // .json, at most 5 MB.
  languageCode: string; // English or a target language of the project. FE pre-selects it from the file name, e.g. "vi.json", "app_vi.json".
  mode: ImportMode; // "When a key already exists".
};
```

| `mode`      | New keys (English file only) | Existing key, untranslated | Existing key, translated |
| ----------- | ---------------------------- | -------------------------- | ------------------------ |
| `Fill`      | Added                        | Filled                     | Kept                     |
| `Overwrite` | Added                        | Filled                     | Replaced by the file     |
| `Update`    | Skipped                      | Filled                     | Replaced by the file     |

New keys are added as `Label` with no description and no max length.

**Response:** `202 Accepted`, no body.

**Errors:** `400` field errors on `file` (not JSON, root is not an object, larger than 5 MB), `languageCode` (unknown or not in the project) or `mode` · `403` no permission · `404` project not found.

**Example request:** `POST /api/projects/1/imports`

```
Content-Type: multipart/form-data; boundary=----x

------x
Content-Disposition: form-data; name="file"; filename="vi.json"
Content-Type: application/json

{ "auth.login.title": "Đăng nhập vào GrapeSEED", "home": { "title": { "welcome": "Chào mừng trở lại!" } } }
------x
Content-Disposition: form-data; name="languageCode"

vi
------x
Content-Disposition: form-data; name="mode"

1
------x--
```
