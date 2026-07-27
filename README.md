# Courier101 Mobile

Customer app for Courier101 couriers. Customers enter their courier code, then
sign in or register, and can track packages, view their dashboard, create
prealerts, request deliveries, submit shop-for-me requests, and manage their
profile.

## Stack

- Expo (managed workflow, TypeScript)
- React Navigation (native stack + bottom tabs)
- TanStack Query for server state
- Zustand for auth/session state (token stored in SecureStore)
- React Hook Form + Zod for forms
- NativeWind (Tailwind) for styling

## Getting started

```bash
npm install
npm start
```

Then press `i` for the iOS simulator or `a` for Android, or scan the QR code
with Expo Go.

## API

The app talks to the courier101 Laravel API. Set the base URL in `.env`:

```
EXPO_PUBLIC_API_URL=http://192.168.x.x:8000
```

Use your machine's LAN IP (not localhost) when running on a physical device.
Restart the dev server after changing `.env`.

Auth flow: `POST /api/courier/code` validates the courier code, then
`POST /api/login` / `POST /api/register` (both include `courier_code`) return a
Sanctum bearer token, which is sent as `Authorization: Bearer <token>` on all
other requests.

## Structure

```
src/
  api/         fetch client, endpoint hooks (TanStack Query), API types
  components/  shared UI (fields, buttons, cards, item card, select sheet)
  navigation/  root navigator, auth stack, tab bar
  screens/
    auth/      courier code, login, register, forgot password
    main/      dashboard, track, prealerts, deliveries, shop for me,
               item details, profile, edit profile, change password, calculator
  store/       zustand auth store
  config.ts    API URL + parish list
```
