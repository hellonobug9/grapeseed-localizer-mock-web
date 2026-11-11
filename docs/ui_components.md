# UI components — which component for which UI

This guide is for AI agents and developers writing UI in `grapeseed-localizer-web`.
Goal: **always reuse existing components** instead of re-writing markup or Tailwind classes that already exist.

## Rules

1. Check the [Quick lookup](#quick-lookup) table before writing JSX. If the UI already has a component, use it and pass `className` only for layout (margin, width, grid) — **never** copy its base classes.
2. Prefer the custom components in `src/components/*.tsx` over shadcn components in `src/components/ui/*` when both cover the same job (see [Do not use](#do-not-use--use-this-instead)).
3. No raw HTML controls (`<button>`, `<input>`, `<select>`, `<textarea>`, `<table>`) in pages. The only exception is a clickable text link inside a sentence.
4. Use only the color tokens from `src/index.css` (`brand`, `text-2`, `surface-2`, `good`, `warn`, `bad`, `comtor`, `live`, `test`…). No hard-coded hex or `blue-500`.
5. Format data with `src/lib/format.ts`; do not re-implement formatters.
6. Create a new component only when a pattern repeats in 2+ places and is not in the table. Shared components go in `src/components/<snake_case>.tsx`; components used by a single page live next to it in `src/pages/<feature>/`.

## Quick lookup

| UI                                                      | Use                                 | Import                                                     |
| ------------------------------------------------------- | ----------------------------------- | ---------------------------------------------------------- |
| Page title, description, breadcrumbs, top-right actions | `PageHeader`                        | `@/components/page_header`                                 |
| Bordered white content block (section card)             | `Panel`                             | `@/components/panel`                                       |
| Panel heading (title + description + actions)           | `PanelHeader`                       | `@/components/panel`                                       |
| Filter/search bar above a table                         | `PanelToolbar`                      | `@/components/panel`                                       |
| Data table                                              | `DataTable`, `Th`, `Tr`, `Td`       | `@/components/data_table`                                  |
| Pagination under a table                                | `Pager`                             | `@/components/pager`                                       |
| Search box with magnifier icon                          | `SearchInput`                       | `@/components/search_input`                                |
| Toggle-button filter (All / Dev / QA…) with counts      | `Segmented`                         | `@/components/segmented`                                   |
| Tabs switching large content areas in a Panel           | `Tabs` + `TabsList variant="line"`  | `@/components/ui/tabs`                                     |
| Status label / tag / role / language code               | `Pill`                              | `@/components/pill`                                        |
| LIVE / TEST environment label                           | `EnvBadge`                          | `@/components/env_badge`                                   |
| Large stat card (dashboard KPI)                         | `KpiCard`                           | `@/components/kpi_card`                                    |
| Small stat box inside a drawer/panel                    | `MiniStat`                          | `@/components/kpi_card`                                    |
| Translation coverage bar with %                         | `CoverageBar`                       | `@/components/coverage_bar`                                |
| Coverage bar only                                       | `CoverageTrack`                     | `@/components/coverage_bar`                                |
| User initials avatar (colored by role)                  | `UserAvatar`                        | `@/components/user_avatar`                                 |
| Project icon                                        | `ProjectIcon` (`sm` / `md` / `lg`)      | `@/components/project_icon`                                    |
| Small dot before a project name                            | `ProjectDot`                            | `@/components/project_icon`                                    |
| Empty / no-results state                                | `EmptyState`                        | `@/components/empty_state`                                 |
| Inline info / warning box                               | `Callout` (`tone="info" \| "warn"`) | `@/components/callout`                                     |
| Highlight search keyword in text                        | `Highlight`                         | `@/components/highlight`                                   |
| Multi-select checkbox tiles (languages…)                | `CheckGrid` + `CheckTile`           | `@/components/choice_tile`                                 |
| Radio cards with title + description                    | `RadioGroup` + `OptionTile`         | `@/components/ui/radio-group` + `@/components/choice_tile` |
| Button, icon button, button-styled link                 | `Button`                            | `@/components/ui/button`                                   |
| Single-line input                                       | `Input`                             | `@/components/ui/input`                                    |
| Multi-line input                                        | `Textarea`                          | `@/components/ui/textarea`                                 |
| Field label (`required` adds a red `*`)                 | `Label`                             | `@/components/ui/label`                                    |
| Validation message under a field                        | `FieldError`                        | `@/components/field_error`                                 |
| `Input` + validation message (`invalid` toggles it)     | `InputField`                        | `@/components/input_field`                                 |
| Styled hover tooltip (instead of `title` for rich text) | `Tooltip` + `TooltipContent`        | `@/components/ui/tooltip`                                  |
| Single-value dropdown in a form/filter                  | `Select`                            | `@/components/ui/select`                                   |
| Standalone checkbox                                     | `Checkbox`                          | `@/components/ui/checkbox`                                 |
| On/off toggle                                           | `Switch`                            | `@/components/ui/switch`                                   |
| Row "…" action menu / user menu                         | `DropdownMenu`                      | `@/components/ui/dropdown-menu`                            |
| Centered popup form                                     | `Dialog`                            | `@/components/ui/dialog`                                   |
| Delete / destructive confirmation popup                 | `ConfirmDialog`                     | `@/components/confirm_dialog`                              |
| Right-side sliding panel (view/edit details)            | `Sheet`                             | `@/components/ui/sheet`                                    |
| Feedback after an action                                | `toast`                             | `sonner`                                                   |
| Hover hint                                              | `title` attribute                   | —                                                          |
| Conditional class merging                               | `cn`                                | `@/lib/utils`                                              |

## Do not use → use this instead

| Do not use                                             | Use instead                                                   |
| ------------------------------------------------------ | ------------------------------------------------------------- |
| `ui/tabs` for filtering data                           | `Segmented` (Tabs are only for switching large content areas) |
| `<div className="rounded-xl border bg-card">`          | `Panel`                                                       |
| Hand-written `<h1>` + `<p>` page heading               | `PageHeader`                                                  |
| `<span className="rounded-full bg-... px-2">` as a tag | `Pill`                                                        |
| `<div className="relative"><Search/><Input/></div>`    | `SearchInput`                                                 |
| Manual role → color mapping                            | `ROLE_TONE` from `@/lib/roles`                                |

## Usage by group

### Page shell

```tsx
<>
  <PageHeader
    title="Users & roles"
    description={`${USERS.length} members`}
    breadcrumbs={[
      { label: "Projects", to: "/projects" },
      { label: project.name },
    ]}
    icon={<ProjectIcon project={project} size="lg" />}
    badge={<EnvBadge env="LIVE" />}
    actions={
      <Button>
        <UserPlus /> Invite user
      </Button>
    }
  />
  <Panel>
    <PanelHeader
      title="Members"
      description="Who can edit"
      actions={
        <Button variant="outline" size="sm">
          Export
        </Button>
      }
    />
    ...
  </Panel>
</>
```

- Do not wrap the page in a container/padding — `AppLayout` already handles it.
- Multiple Panels on one page: wrap them in `<div className="grid gap-5">` or a column grid; do not add styles to Panel.

### List page (table + filters + empty state + pagination)

```tsx
<Panel>
  <PanelToolbar>
    <Segmented
      value={role}
      onChange={setRole}
      options={[{ value: "all", label: "All", count: 12 }]}
    />
    <SearchInput
      className="max-w-[320px]"
      placeholder="Search…"
      value={query}
      onChange={(e) => setQuery(e.target.value)}
    />
  </PanelToolbar>

  {rows.length === 0 ? (
    <EmptyState icon={Users} title="No users found">
      Try another filter.
    </EmptyState>
  ) : (
    <DataTable>
      <thead>
        <tr>
          <Th>Name</Th>
          <Th numeric>Keys</Th>
          <Th />
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <Tr key={r.id}>
            <Td>{r.name}</Td>
            <Td numeric>{formatNumber(r.keys)}</Td>
            <Td className="text-right whitespace-nowrap">...actions</Td>
          </Tr>
        ))}
      </tbody>
    </DataTable>
  )}

  <Pager
    page={page}
    pageCount={pageCount}
    pageSize={PAGE_SIZE}
    shown={rows.length}
    total={total}
    noun="users"
    onPageChange={setPage}
  />
</Panel>
```

- Numeric columns: use the `numeric` prop on both `Th` and `Td`; do not add `text-right tabular-nums` manually.
- Header row uses a plain `<tr>`; body rows use `Tr` (hover + border).
- Keep filters in the URL when the link should be shareable: use `useSearchParams` as in `users_page.tsx`.

### Row actions

```tsx
<Button variant="outline" size="icon-sm" title="Edit" onClick={onEdit}><Pencil /></Button>
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="outline" size="icon-sm" aria-label="More"><Ellipsis /></Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end" className="w-44">
    <DropdownMenuItem onSelect={...}><Mail /> Resend invite</DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuItem variant="destructive" onSelect={...}><Trash /> Remove</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

### Button

| Purpose                                 | Props                                                |
| --------------------------------------- | ---------------------------------------------------- |
| Primary action (Save, Create, Invite)   | default                                              |
| Secondary action, Cancel, table buttons | `variant="outline"`                                  |
| Subtle toolbar button                   | `variant="ghost"`                                    |
| Delete / dangerous                      | `variant="destructive"`                              |
| Text link                               | `variant="link"`                                     |
| Icon-only button                        | `size="icon-sm"` (in tables), `"icon"`, `"icon-lg"`  |
| Navigation                              | `<Button asChild><Link to="...">...</Link></Button>` |

- Put icons directly as children: `<Button><Plus /> New key</Button>` — Button sizes the icon itself; do not add `className="size-4"`.
- Icon-only buttons must have `title` or `aria-label`.

### Pill (tag / status)

| Meaning                          | `tone`                                           |
| -------------------------------- | ------------------------------------------------ |
| Success, active, translated      | `good`                                           |
| Pending, invited, warning        | `warn`                                           |
| Error, missing                   | `bad`                                            |
| Neutral, disabled, language code | `gray` (default)                                 |
| Info, light emphasis             | `blue`                                           |
| New                              | `new`                                            |
| Role                             | `ROLE_TONE[user.role]` (`admin` / `dev` / `comtor`) |

Use `size="xs"` next to small text. Child icons are sized to `size-3` automatically.

### Form in a Dialog

Follow the structure of `src/pages/languages/language_dialog.tsx`:

```tsx
<Dialog open={open} onOpenChange={onOpenChange}>
  <DialogContent className="sm:max-w-2xl">
    {open && (
      <XForm
        key={item?.id ?? "new"}
        item={item}
        onDone={() => onOpenChange(false)}
      />
    )}
  </DialogContent>
</Dialog>
```

```tsx
<form onSubmit={submit} className="grid gap-4">
  <DialogHeader>
    <DialogTitle>{item ? `Edit ${item.name}` : "Add item"}</DialogTitle>
  </DialogHeader>
  <div className="space-y-1.5">
    <Label htmlFor="item-name">Name</Label>
    <Input
      id="item-name"
      required
      value={name}
      onChange={(e) => setName(e.target.value)}
    />
    <p className="text-xs text-muted-foreground">Hint text</p>
  </div>
  <DialogFooter>
    <Button type="button" variant="outline" onClick={onDone}>
      Cancel
    </Button>
    <Button type="submit">Save</Button>
  </DialogFooter>
</form>
```

- Split the form into a child component rendered as `{open && ...}` with a `key` so its state resets — do not reset the form with `useEffect`.
- One field = `div.space-y-1.5` > `Label` + control + optional hint.
- Required fields: `<Label required>` (shows `*`). Validate in `submit` with `noValidate` on the form, keep errors in state, set `aria-invalid` on the control, show `<FieldError>{error && t('common.errors.required')}</FieldError>` under it (for a plain `Input`, use `<InputField invalid={error} error={message?} />` — the message defaults to "required"), and clear the error in `onChange`.
- Several fields on one row: `grid gap-4 md:grid-cols-12` + `md:col-span-*`.
- After submit: `toast.success(...)`.

### Sheet (right drawer)

Follow `src/pages/projects/components/project_drawer.tsx`:

```tsx
<Sheet open={!!item} onOpenChange={onOpenChange}>
  <SheetContent className="w-full gap-0 p-0 sm:max-w-[480px]">
    <SheetHeader className="border-b px-6 py-4">
      <SheetTitle>{item.name}</SheetTitle>
      <SheetDescription>...</SheetDescription>
    </SheetHeader>
    ...
  </SheetContent>
</Sheet>
```

Use a Sheet to view/edit details while keeping the list visible behind it; use a Dialog for create forms or confirmations.

### Choices in forms

| Case                                             | Use                         |
| ------------------------------------------------ | --------------------------- |
| Pick one from many (long list)                   | `Select`                    |
| Pick one of 2–4, each needs a description        | `RadioGroup` + `OptionTile` |
| Pick one of 2–5, short labels, applies instantly | `Segmented`                 |
| Pick many                                        | `CheckGrid` + `CheckTile`   |
| Single on/off flag                               | `Switch`                    |
| Single agreement tick                            | `Checkbox` + `Label`        |

```tsx
<RadioGroup value={env} onValueChange={setEnv}>
  <OptionTile value="TEST" checked={env === 'TEST'} title="Test" description="Internal QA only" />
  <OptionTile value="LIVE" checked={env === 'LIVE'} title="Live" description="All users" />
</RadioGroup>

<CheckGrid>
  {languages.map((l) => (
    <CheckTile key={l.code} checked={selected.has(l.code)} onCheckedChange={(v) => toggle(l.code, v)}>
      {l.name}
    </CheckTile>
  ))}
</CheckGrid>
```

### Stats

```tsx
<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
  <KpiCard label="Total keys" value={formatNumber(total)} icon={Key} tone="primary" footer="across 14 projects" />
</div>

<div className="grid grid-cols-3 gap-2">
  <MiniStat value={formatNumber(missing)} label="Missing" valueClassName="text-bad" />
</div>

<CoverageBar value={stats.coverage} />
```

## Existing helpers — do not re-implement

| Need                                     | Use (`@/lib/format`)                                      |
| ---------------------------------------- | --------------------------------------------------------- |
| `12 Oct 2026`                            | `formatDay(date)`                                         |
| `12 Oct 2026, 09:30`                     | `formatExact(date)`                                       |
| `3 hours ago`                            | `formatRelative(date)` — with `title={formatExact(date)}` |
| `Today` / `Yesterday` / `Monday, 12 Oct` | `formatDayLabel(day)`                                     |
| `12,345`                                 | `formatNumber(n)`                                         |
| `87%`                                    | `formatPercent(value, digits)`                            |
| `3 keys` / `1 key`                       | `plural(count, 'key')`                                    |
| Name initials                            | `initials(name)`                                          |
| Strip HTML to text                       | `plainText(html)`                                         |
| Not translated for > 14 days             | `isStale(date)`                                           |

Date math (`addDays`, `startOfDay`, `isSameDay`, `toIsoDate`…) lives in `@/lib/dates`.
