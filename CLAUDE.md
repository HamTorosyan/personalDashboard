# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Personal dashboard with a 2-week Outlook-style calendar. Events are pulled from:
- **Microsoft Graph API** — Outlook + Teams meetings (supports two accounts simultaneously)
- **Zoom API** — direct Zoom meeting fetch
- **Nager.Date** — public holidays by country (free, no auth)

Auth is handled by **next-auth v5 (beta)** with OAuth browser flows.

## Commands

```bash
npm run dev       # Start development server (localhost:3000)
npm run build     # Production build (type-checks and lints)
npm run start     # Start production server
npm run lint      # ESLint
```

## Setup required before OAuth works

Copy `.env.local.example` to `.env.local` and fill in:
1. **Microsoft**: Register an Azure AD app at `portal.azure.com` with account type "Multitenant + personal Microsoft accounts" and redirect URI `http://localhost:3000/api/auth/callback/microsoft-entra-id`. Permissions: `Calendars.Read`, `User.Read`, `offline_access`.
2. **Zoom**: Create a User-managed OAuth app at `marketplace.zoom.us` with redirect URL `http://localhost:3000/api/auth/callback/zoom` and scope `meeting:read`.

`AUTH_SECRET` is already pre-generated in `.env.local`.

## Architecture

### Key files

| Path | Role |
|------|------|
| `src/lib/auth.ts` | Auth.js config — Microsoft + Zoom providers, JWT callbacks, token refresh |
| `src/lib/types.ts` | `CalendarEvent` (unified event type), `MicrosoftAccountToken` |
| `src/lib/dateUtils.ts` | Two-week range helpers, grid row calculation, time slots |
| `src/lib/microsoft.ts` | `fetchMicrosoftEvents()` + `normalizeMicrosoftEvent()` |
| `src/lib/zoom.ts` | `fetchZoomMeetings()` + `normalizeZoomMeeting()` |
| `src/lib/holidays.ts` | `fetchHolidays()` (Nager.Date) + `normalizeHoliday()` |
| `src/app/api/calendar/route.ts` | Aggregator: calls MS + Zoom in parallel, deduplicates |
| `src/app/api/holidays/route.ts` | `?countries=AM,US` — filters to 2-week window, 24h cache |
| `src/components/calendar/WeekGrid.tsx` | CSS Grid week view; handles overlapping events with column math |
| `src/components/Dashboard.tsx` | Top-level client shell — wires hook, CountrySelector, AuthButtons |
| `src/hooks/useCalendarEvents.ts` | Fetches `/api/calendar` + `/api/holidays`, polls every 5 min |

### Two Microsoft accounts

The JWT stores a `microsoftAccounts[]` array keyed by `oid` (the MSAL stable account identifier). Each Microsoft OAuth completion upserts into this array. Both accounts' calendars are fetched in parallel in `/api/calendar`. The sign-in page has two buttons — both call `signIn("microsoft-entra-id")`; the `prompt: "select_account"` param forces the account picker so the user can pick which account to add.

### Calendar grid layout

`WeekGrid` uses a CSS Grid with `grid-cols-[3rem_repeat(7,1fr)]`. Time slots run 08:00–20:00 in 30-min rows (25 rows). Timed event vertical position: `rowStart = floor(minutesSince8am / 30) + 2`. Overlapping events on the same day get `left%` / `width%` calculated by a greedy column-assignment algorithm in `WeekGrid.tsx`.

### Event color coding

`blue` = Outlook calendar event · `purple` = Teams meeting (`onlineMeeting !== null`) · `cyan` = Zoom · `green` = public holiday · `gray` = cancelled
