# Digital Notice Board

A React + Vite college noticeboard. Public visitors can browse current notices; provisioned administrators sign in with Supabase Auth to publish, edit, and remove notices. Supabase is the only data source—there is no mock-data fallback.

## Install and run

```sh
npm install
cp .env.example .env
```

On Windows PowerShell, copy the environment template with:

```powershell
Copy-Item .env.example .env
```

Set the Supabase values described below in `.env`, then start the Vite development server:

```sh
npm run dev
```

Use `npm run build` to create a production build and `npm run lint` to run ESLint.

## Environment variables

Add the following values to the local `.env` file. The URL and anon/publishable key are available in the Supabase project's API settings.

```dotenv
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

The frontend deliberately uses only the public anon/publishable key. Never put a service-role key, database password, or other private credential in a `VITE_` variable. If these values are missing, the app shows a setup message instead of using placeholder data. Restart Vite after changing `.env`.

## Supabase setup

1. Create a Supabase project and open its SQL Editor.
2. If the `notices` table does not already exist, the SQL below documents the expected columns and policies. Do not run the table-creation statement against an existing table; apply only the policies and indexes that your project still needs.
3. In Supabase Authentication settings, disable public sign-ups. This starter treats provisioned, authenticated accounts as administrators, so only create accounts for trusted notice managers.
4. Copy the project URL and anon/publishable key into `.env`.
5. In Authentication → Users, add an admin user with their email and a temporary password. Share the credentials securely and have the admin change the password through your institution's approved process. Do not add credentials to this repository.
6. In Storage, create a **public** bucket named `notice-images` and set its maximum file size to **5 MB**. Add authenticated-only `INSERT` and `DELETE` policies on `storage.objects` for this bucket so admins can upload, replace, and remove files. Public buckets allow public image retrieval.

### Notices table SQL

```sql
create table if not exists public.notices (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(trim(title)) between 1 and 180),
  content text not null check (char_length(trim(content)) > 0),
  category text not null check (
    category in ('Academic', 'Examination', 'Events', 'Placements', 'General')
  ),
  priority text not null default 'Normal' check (
    priority in ('Normal', 'Important', 'Urgent')
  ),
  published_at timestamptz not null default now(),
  expires_at date not null,
  created_at timestamptz not null default now(),
  image_url text,
  image_path text
);

create index if not exists notices_expires_at_idx
  on public.notices (expires_at);
create index if not exists notices_published_at_idx
  on public.notices (published_at desc);

alter table public.notices enable row level security;

grant select on public.notices to anon, authenticated;
grant insert, update, delete on public.notices to authenticated;

create policy "Anyone can read active notices"
  on public.notices
  for select
  to anon, authenticated
  using (expires_at >= current_date);

create policy "Authenticated admins can manage notices"
  on public.notices
  for all
  to authenticated
  using (true)
  with check (true);
```

The policies limit anonymous reads to active notices and require a Supabase Auth session for writes. Because the frontend does not define a separate role system, **every authenticated account has management access**. Keep public sign-ups disabled and only provision trusted admin users. For a public-facing deployment with multiple user types, add a server-managed admin-role/allowlist check in both the app and database policies before enabling other account types.

## How it works

React calls Supabase directly through `@supabase/supabase-js` using the URL and public anon key from Vite environment variables. Row-level security is enforced by PostgreSQL for both public notice reads and authenticated create/update/delete operations. The client filters active notices using `expires_at`, displays and sorts by `published_at`, and RLS independently prevents anonymous reads of expired notices. Authentication and sessions are handled by Supabase Auth; this project does not implement password storage or a separate backend.

## Project structure

```text
src/
  components/
    Navbar.jsx
    NoticeCard.jsx
    NoticeForm.jsx
  lib/
    noticeUtils.js
    supabase.js
  pages/
    AdminLogin.jsx
    Home.jsx
    NoticeDetails.jsx
    NoticeEditor.jsx
  App.jsx
  main.jsx
  style.css
```

## Features

- Search and category/priority filters for active notices.
- Notice detail pages with publication and expiry dates.
- Supabase Auth admin login and protected notice management screen.
- Create, edit, and confirmed delete operations with success/error feedback.
- Optional notice images stored in the public `notice-images` bucket, with replacement and deletion cleanup.
- Responsive layout, explicit priority labels, and loading/empty/error states.
