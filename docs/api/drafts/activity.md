# Activity screen API

Draft endpoint contracts for the `/activity` screen, written from the current UI. One file = one Jira ticket. Not sent to BE yet.
After BE agrees, move each endpoint into `docs/api/<domain>.md` with a status line, then delete this file.

| Endpoint                  | Used by                                                   |
| ------------------------- | --------------------------------------------------------- |
| `GET /api/activity`       | Activity feed, day groups, pager                          |
| `GET /api/projects/list`   | *Project* filter options (Projects ticket)        |
| `GET /api/languages`      | *Language* filter options (Projects ticket)           |

The screen is also opened with filters from other screens: the Projects drawer (`/activity?projectId={id}`), the Languages row menu and drawer (`/activity?lang={code}`) and the Dashboard.

**Shared rules**

- Times are ISO 8601 UTC strings.
- Every role can open the screen. A user only sees events of the projects they can see in `GET /api/projects/list`.
- BE sends data, not sentences. FE builds the line ("translated 24 keys to Vietnamese") from `type` and the fields below, so it can be translated.
- Events are never edited or deleted. Names are copied into the event when it is recorded, so renaming or deleting a user, project or language does not change past events.
- **Not in the DB yet:** nothing records these events today (`users.LastActivity` only keeps the last request time). BE needs a new events table.
- Enums are numbers in requests and responses; values are listed under **Enums**. Enums BE already has keep their C# values; new ones start at 1, like most BE enums.
- Error bodies follow the shared error format (Foundation ticket).

**Enums**

```ts
enum ActivityType {
  Translate = 1, // Texts are saved for keys that were untranslated in that language. Saves by the same user in the same project and language less than 30 minutes apart merge into one event.
  Edit = 2, // Texts are changed for keys that were already translated in that language. Merged like Translate.
  Upload = 3, // A JSON file is imported (Upload ticket).
  AddKeys = 4, // Keys are created, one by one or through an upload.
  PublishTest = 5, // Translations are published to TEST (Publish & download ticket).
  PublishLive = 6, // Translations are published to LIVE (Publish & download ticket).
  Lock = 7, // PUT /api/projects/{id}/lock (lock now or schedule). A lock that ends on its own at endAt records nothing.
  Unlock = 8, // DELETE /api/projects/{id}/lock on a Locked or Scheduled project.
  AddLanguage = 9, // PUT /api/projects/{id}/languages adds a target language. One event per language.
  RemoveLanguage = 10, // PUT /api/projects/{id}/languages removes a target language. One event per language.
}

enum UserRole { Developer = 1, Comtor = 2, Admin = 3 } // AppRoleEnum in BE.

enum ActivityPeriod { Last24Hours = 1, Last7Days = 2, Last30Days = 3, AllTime = 4 }
```

## `GET /api/activity`

Used by: `/activity` (feed, day groups, pager). Called on load and whenever a filter or the page changes.

**Request (query):**

```ts
type ActivityQuery = {
  projectId?: number; // From GET /api/projects/list or project.id below. Omitted = all projects.
  languageCode?: string; // From GET /api/languages or language.code below. Omitted = all languages.
  period?: ActivityPeriod; // Default Last30Days, counted back from server time.
  page?: number; // 1-based, default 1.
  pageSize?: number; // Default 25.
};
```

**Response:** `200 OK`

```ts
type ActivityListResponse = {
  items: {
    id: number;
    occurredAt: string; // Last save for a merged event. FE groups by day in the user's time zone.
    type: ActivityType; // Icon and sentence.
    user: {
      name: string;
      role: UserRole | null; // Role at the time; null if the user was deleted.
    };
    project: {
      id: number;
      name: string;
    };
    language: {
      code: string;
      name: string; // English name.
    } | null; // Translate, Edit, Upload, AddLanguage, RemoveLanguage only.
    count: number | null; // Translate, Edit, Upload, AddKeys: keys (distinct keys for a merged event). Publish*: keys changed since the last publish to that environment.
    fileName: string | null; // Upload only.
    lock: {
      startAt: string; // After occurredAt = scheduled lock.
      endAt: string | null; // Exclusive; null = until unlocked.
    } | null; // Lock and Unlock only.
  }[]; // Newest first, then highest id.
  total: number; // All matching events, for the pager.
};
```

**Errors:**

- `400`: invalid query value.
- `403`: no access to the project.

An unknown `projectId` or `languageCode` is not an error: it returns `{ "items": [], "total": 0 }`. A `page` past the last page also returns an empty `items` with the real `total`.

**Example request:** `GET /api/activity?projectId=3&period=3&page=1&pageSize=25` (Last30Days)

**Example response:**

```json
{
  "items": [
    {
      "id": 90412,
      "occurredAt": "2026-10-30T02:15:00Z",
      "type": 1,
      "user": { "name": "An Nguyen", "role": 2 },
      "project": { "id": 3, "name": "Connect site" },
      "language": { "code": "vi", "name": "Vietnamese" },
      "count": 24,
      "fileName": null,
      "lock": null
    },
    {
      "id": 90388,
      "occurredAt": "2026-10-29T09:40:00Z",
      "type": 7,
      "user": { "name": "Binh Le", "role": 1 },
      "project": { "id": 3, "name": "Connect site" },
      "language": null,
      "count": null,
      "fileName": null,
      "lock": { "startAt": "2026-10-31T17:00:00Z", "endAt": "2026-11-07T17:00:00Z" }
    },
    {
      "id": 90301,
      "occurredAt": "2026-10-28T04:05:00Z",
      "type": 5,
      "user": { "name": "Binh Le", "role": 1 },
      "project": { "id": 3, "name": "Connect site" },
      "language": null,
      "count": 18,
      "fileName": null,
      "lock": null
    },
    {
      "id": 90277,
      "occurredAt": "2026-10-27T08:30:00Z",
      "type": 10,
      "user": { "name": "Binh Le", "role": 1 },
      "project": { "id": 3, "name": "Connect site" },
      "language": { "code": "id", "name": "Indonesian" },
      "count": null,
      "fileName": null,
      "lock": null
    }
  ],
  "total": 57
}
```
