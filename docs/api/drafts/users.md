# Users & roles screen API

Draft endpoint contracts for the `/users` screen, written from the current UI. One file = one Jira ticket. Not sent to BE yet.
After BE agrees, move each endpoint into `docs/api/<domain>.md` with a status line, then delete this file.

| Endpoint                              | Used by                                                       |
| ------------------------------------- | ------------------------------------------------------------- |
| `GET /api/users`                      | Table, role tabs with counts, search                          |
| `POST /api/users`                     | *Invite user* dialog                                          |
| `PUT /api/users/{id}`                 | *Edit* dialog (row menu or click on the name)                 |
| `POST /api/users/{id}/invitation`     | Row menu *Resend invite*                                      |
| `PUT /api/users/{id}/status`          | Row menu *Disable* / *Enable*                                 |
| `DELETE /api/users/{id}`              | Row menu *Remove* (confirm dialog)                            |
| `GET /api/projects/list`          | Dialog *Projects* checkboxes (Projects ticket)        |
| `GET /api/languages`                  | Dialog *Languages to translate* checkboxes (Projects ticket) |

The role tabs are kept in the URL (`/users?role=comtor`); FE maps it to `UserRole`.

**Shared rules**

- Only Admin can call these endpoints; other roles get `403`. FE hides the screen for them (Foundation ticket).
- Times are ISO 8601 UTC strings.
- Admins see and work in every project, including ones added later. For other roles, `projectIds` are the only projects they can see (`GET /api/projects/list`) and work in.
- Email is set by the invite, and an Admin can still correct it while the user is `Invited` (`PUT /api/users/{id}`). Once the user accepts, only the user can change it, in the separate account service and web; these endpoints no longer change it. `GET /api/users` returns the current email from that service.
- Only Comtors are limited by language: `languageCodes` are the languages they can translate, and `[]` means none assigned yet. Other roles read every language and get `languageCodes: null`; FE shows "All" for `null` and nothing for `[]`.
- An Admin cannot change their own role, disable or remove themselves (`409`). This keeps at least one Admin.
- **Not in the DB yet:** `email`, `status` and invitations live in the Account service; the Localizer DB stores name, role, languages, projects and last activity.
- Enums are numbers in requests and responses; values are listed under **Enums**. Enums BE already has keep their C# values; new ones start at 1, like most BE enums.
- Error bodies follow the shared error format (Foundation ticket).

**Enums**

```ts
enum UserRole { Developer = 1, Comtor = 2, Admin = 3 } // AppRoleEnum in BE.

enum UserStatus {
  Active = 1, // Has accepted the invitation and is not disabled.
  Invited = 2, // Has not accepted the invitation yet and is not disabled.
  Disabled = 3, // Disabled by an Admin; cannot sign in. Wins over the other two.
}
```

## `GET /api/users`

Used by: `/users`. Called on load and whenever the role tab, search or page changes.

**Request (query):**

```ts
type UserListQuery = {
  role?: UserRole; // Omitted = all roles (All tab).
  q?: string; // Case-insensitive "contains" on name or email, trimmed. Omitted or blank = no search.
  page?: number; // 1-based, default 1.
  pageSize?: number; // Default 25.
};
```

**Response:** `200 OK`

```ts
type UserListResponse = {
  items: {
    id: string; // Account user id (GUID).
    name: string;
    email: string;
    role: UserRole; // Role pill; pre-selected in the Edit dialog.
    status: UserStatus; // Status pill; which row actions are offered (see below).
    languageCodes: string[] | null; // Pill text; FE takes the name for the tooltip from GET /api/languages. Comtor: assigned languages, may be []. Other roles: null.
    projectIds: number[] | null; // Pre-checked boxes in the Edit dialog. Admin: null.
    lastActiveAt: string | null; // Last request the user made while signed in; null if never signed in. FE shows relative time, exact time on hover.
  }[]; // By role (Admin, Developer, Comtor), then name.
  total: number; // All users matching role + q, for the pager.
  roleCounts: {
    role: UserRole;
    count: number;
  }[]; // Tab counts, one item per role. Ignores role, q and page; All = the sum.
};
```

Disabled and invited users are included. Row actions by status: *Resend invite* only for `Invited`; *Enable* for `Disabled`, *Disable* otherwise; *Edit* and *Remove* always.

**Errors:**

- `400`: invalid query value (e.g. unknown `role`).
- `403`: not an Admin.

A `page` past the last page returns empty `items` with the real `total`.

**Example request:** `GET /api/users?role=2&q=nguyen&page=1&pageSize=25` (Comtor)

**Example response:**

```json
{
  "items": [
    {
      "id": "3f2b6c1e-8a4d-4f1e-9c2a-1b7d5e9f0a21",
      "name": "Mai Nguyen",
      "email": "mai.nguyen@example.com",
      "role": 2,
      "status": 1,
      "languageCodes": ["ja", "vi"],
      "projectIds": [1, 2, 3, 7, 10, 12],
      "lastActiveAt": "2026-10-30T01:12:00Z"
    }
  ],
  "total": 1,
  "roleCounts": [
    { "role": 3, "count": 1 },
    { "role": 1, "count": 4 },
    { "role": 2, "count": 11 }
  ]
}
```

## `POST /api/users`

Used by: `/users` (*Invite user* dialog → *Send invite*).

Creates the user with status `Invited` and emails them an invitation link. Accepting it makes them `Active`.

**Request:**

```ts
type UserRequest = {
  name: string; // Required, trimmed.
  email: string; // Required, valid email, unique (case-insensitive), trimmed.
  role: UserRole; // FE default Developer.
  languageCodes: string[] | null; // Comtor: the assigned languages, may be []. Other roles: null (a list is ignored).
  projectIds: number[] | null; // Non-Admin: may be []. The "All projects" switch just checks every box, so projects added later are not included. Admin: FE hides the section and sends null (a list is ignored).
};
```

**Response:** `201 Created`

```ts
type CreateUserResponse = {
  id: string; // Account user id (GUID). FE then refetches GET /api/users.
};
```

**Errors:**

- `400`: field errors on `name`, `email`, `languageCodes` (unknown or source language, or `null` for a Comtor) or `projectIds` (unknown project, or `null` for a non-Admin). FE shows each one under its field.
- `403`: not an Admin.
- `409`: `email` is already used by another user (field error on `email`).

**Example request:**

```json
{
  "name": "Putri Ayu",
  "email": "putri.ayu@example.com",
  "role": 2,
  "languageCodes": ["id"],
  "projectIds": [2, 5, 7, 11]
}
```

**Example response:**

```json
{ "id": "6a8e0c2d-1f4b-4d7a-9e3c-5b7d9f1a3c58" }
```

## `PUT /api/users/{id}`

Used by: `/users` (*Edit* dialog → *Save changes*).

Replaces all fields. Email only while the user is `Invited`. Status is not changed here.

```ts
type UpdateUserRequest = UserRequest; // Email is editable in the Edit dialog only for `Invited` users; otherwise FE sends the current email unchanged.
```

- Changing the email of an `Invited` user cancels the old invitation link and sends a new one to the new email right away. Same rules as `POST`: valid, unique (case-insensitive), trimmed.
- For any other status, sending a different email returns `409`; sending the current one (case-insensitive) is fine.
- Changing the role away from Comtor drops the assigned languages; the user then reads every language.
- Changing the role to Admin drops the assigned projects; the user then sees every project. Changing it from Admin uses the `projectIds` sent.
- Changing the role signs the user out of every session (revokes both access and refresh tokens). Their next request returns `401` with `code: "RoleChanged"`; FE sends them to sign-in with a message.
- Changing languages or projects applies on the user's next request; no need to sign in again.

**Response:** `204 No Content`. FE then refetches `GET /api/users`.

**Errors:**

- `400`: same field errors as `POST`.
- `403`: not an Admin.
- `404`: user not found.
- `409`: `email` is already used by another user (field error on `email`); changing your own role (sending the same role is fine); or changing the email of a user who is not `Invited`.

**Example request:** `PUT /api/users/3f2b6c1e-8a4d-4f1e-9c2a-1b7d5e9f0a21`

```json
{
  "name": "Mai Nguyen",
  "email": "mai.nguyen@example.com",
  "role": 2,
  "languageCodes": ["vi", "ja", "ko"],
  "projectIds": [1, 2, 3, 7, 10, 12]
}
```

## `POST /api/users/{id}/invitation`

Used by: `/users` (row menu *Resend invite*). No request body.

Sends a new invitation email; the previous link stops working.

**Response:** `204 No Content`. FE shows "Invitation re-sent to {email}".

**Errors:**

- `403`: not an Admin.
- `404`: user not found.
- `409`: user is not `Invited` (already accepted, or disabled).

## `PUT /api/users/{id}/status`

Used by: `/users` (row menu *Disable* / *Enable*).

**Request:**

```ts
type UserStatusRequest = {
  disabled: boolean;
};
```

**Rules:**

- Disabling signs the user out, blocks sign-in and makes a pending invitation link stop working. Role, languages and projects are kept.
- Enabling returns the user to `Active`, or to `Invited` if they never accepted, in which case BE sends a new invitation email right away (the old link was cancelled on disable).
- Setting the current value again does nothing and still returns `204`.

**Response:** `204 No Content`. FE then refetches `GET /api/users`.

**Errors:**

- `400`: missing `disabled`.
- `403`: not an Admin.
- `404`: user not found.
- `409`: disabling yourself.

**Example request:** `PUT /api/users/9d41a7e2-5c3b-4e8f-b1d6-0a2c4e6f8b34/status`

```json
{ "disabled": false }
```

## `DELETE /api/users/{id}`

Used by: `/users` (row menu *Remove* → confirm dialog). No request body.

Removes the user permanently ("can't be undone"): they lose access to every project and language and a pending invitation stops working. Past activity stays with the copied name and `role: null` (Activity ticket).

**Response:** `204 No Content`. FE then refetches `GET /api/users`.

**Errors:**

- `403`: not an Admin.
- `404`: user not found.
- `409`: removing yourself.

## `GET /api/projects/list`, `GET /api/languages`

Used by: `/users` dialog. *Projects* checkboxes (non-Admin only) use `id` and `name`; FE picks the project color from `id`; *Languages to translate* (Comtor only) lists every language except English (`en`) and uses `code` and `name`. Same endpoints as the Projects ticket.
