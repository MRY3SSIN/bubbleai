# BubbleAI

BubbleAI is a cross-platform Expo + React Native MVP for iOS and Android, designed as a calm emotional wellness companion with Supabase and server-side OpenAI integration.

## Stack

- Expo + React Native + TypeScript
- Expo Router
- Supabase Auth, Postgres, Storage, Edge Functions, and RLS
- OpenAI Responses API, Realtime sessions, and Moderations via Supabase Edge Functions
- React Query, Zustand, React Hook Form, Zod
- Expo Secure Store, Notifications, Contacts, Audio

## What is implemented

- Welcome, auth, onboarding, tabs, chat, voice, insights, notifications, profile, settings
- Mock mode with seeded demo data
- Transparent Bubble Score logic
- Supabase SQL schema and Edge Function scaffold
- Safety helpers for green, yellow, and red routing
- Unit tests for score, risk, chart, onboarding validation, and session title fallback
- Maestro smoke flows for auth, onboarding, chat, and journal safety

## Setup

1. Install dependencies

```bash
npm install
```

2. Copy environment variables

```bash
cp .env.example .env.local
```

3. Fill in only safe development values in `.env.local`

Mobile:

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- `EXPO_PUBLIC_APP_ENV`
- optional flags:
  - `EXPO_PUBLIC_ENABLE_APPLE_AUTH`
  - `EXPO_PUBLIC_ENABLE_GOOGLE_AUTH`
  - `EXPO_PUBLIC_ENABLE_PHONE_AUTH`

Server only, for Supabase secrets or local functions:

- Copy `.env.server.example` into a server-only location if you need local Supabase function development.
- Do not place these values in `.env.local` for the Expo app.

- `OPENAI_API_KEY`
- `OPENAI_TEXT_MODEL`
- `OPENAI_REALTIME_MODEL`
- `OPENAI_MODERATION_MODEL`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

4. Start the app

```bash
npm run start
```

## Expo development build

BubbleAI is now linked to EAS and includes `expo-dev-client`, so you can run it as a custom Expo development app instead of Expo Go.

1. Create your local env file

```bash
cp .env.example .env.local
```

2. Fill the mobile values in `.env.local`

```bash
EXPO_PUBLIC_SUPABASE_URL=...
EXPO_PUBLIC_SUPABASE_ANON_KEY=...
EXPO_PUBLIC_APP_ENV=mock
```

Use `mock` for the fastest first run. Switch to `live` only when you want the app talking to your linked Supabase backend.

If you need local Supabase function work, keep server-only secrets in a separate file based on `.env.server.example` instead of loading them into the Expo app environment.

3. Build the dev client

Android device or emulator:

```bash
eas build --profile development --platform android
```

iOS device:

```bash
eas build --profile development --platform ios
```

iOS simulator:

```bash
eas build --profile development-simulator --platform ios
```

4. Start Metro for the dev client

```bash
npm run dev
```

5. Install and open the dev build, then connect it to the running Metro server.

Helpful extras:

```bash
npm run dev:android
npm run dev:ios
```

## Mock mode

Set:

```bash
EXPO_PUBLIC_APP_ENV=mock
```

Mock mode gives you:

- seeded auth state
- dashboard, journal, notifications, and analytics demo data
- fake AI chat responses
- simulated voice flow

## Supabase

SQL migrations live in [`supabase/migrations`](/Volumes/External/Apps/Bubble AI - Psy/bubbleai/supabase/migrations).

Apply with the Supabase CLI after linking your project:

```bash
supabase db push
supabase functions deploy create-realtime-session
supabase functions deploy moderate-message
supabase functions deploy classify-risk
supabase functions deploy text-chat-response
supabase functions deploy generate-insights
supabase functions deploy send-notifications
```

## Testing

```bash
npm run test
npm run typecheck
```

## Security notes

- Do not put permanent OpenAI keys in the app
- Do not commit real secrets
- Treat any previously pasted secrets as compromised and rotate them before any real deployment
- Keep BubbleAI clearly positioned as support, not emergency or medical care
