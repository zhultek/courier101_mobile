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

## Office arrival alerts and online payments

Native builds request notification permission after sign-in. Profile → Office arrival alerts shows the permission state and opens device settings when needed. Alerts open Track → Ready and refresh package data. The Laravel backend must be deployed with its push-device migration and queue worker before distributing this build. APNs/FCM credentials must be configured in the existing Expo project; Android also needs the matching Firebase `google-services.json` configured through `expo.android.googleServicesFile`. Push delivery cannot be tested in Expo Go or the web build. Create a new native development/preview/production build after installing the notification module.

Fygaro uses the courier's existing website link and visibility setting. Make Payment appears on Dashboard and Track → Ready when the API enables it. The app shows the full ready-package total, checks availability again before checkout, opens the courier's link in the in-app browser and refreshes balances when checkout closes.

Backend deployment and device test details are in the Laravel repository's `docs/mobile-office-push.md`.

The admin Mobile App Access switch also applies to existing sessions. The app checks on startup/foreground and every 15 seconds while active. Rejected access clears the saved courier, token, profile and customer cache, returning to courier-code entry with an invalid-code message. Disabled couriers cannot be selected or signed into. Network failures preserve the session until the server can be reached. Run `npm test` for the access/reset tests, followed by `npx tsc --noEmit`.

## Connection errors and prealert invoices

Customer lists, details and form lookups show connection/server errors with a **Try again** action. Failed refreshes keep previously loaded information visible and mark it as such. Read requests time out after 30 seconds; multipart uploads allow two minutes. Failed submissions retain entered form data for another attempt.

Prealerts support **Photo library** and **Choose file** (PDF or image, up to 10 MB). Selecting a replacement can be cancelled without losing the existing attachment. The Laravel API already supports these uploads; no migration is needed. Build a new native app binary to include `expo-document-picker`, then verify PDF/photo selection and upload on iOS and Android devices.

Run `npm test` and `npx tsc --noEmit`. The backend upload contract is covered by `php artisan test --filter=MobilePrealertUploadTest` in the Laravel repository, using an isolated in-memory SQLite database and fake storage.

## Crash recovery

The entry point registers a small recovery shell before loading the app. Startup import failures, React screen/render failures, and uncaught JavaScript runtime errors show a recovery screen with a `C101-…` reference. Users can retry, return to the dashboard, sign in again, or share diagnostic details. Returning to the dashboard resets navigation history and query caches without deleting the account. Each navigator wraps its screens so a failed detail screen does not remove navigation for the entire app.

Saved courier/profile data is validated before restoring the secure token. Corrupt or incomplete saved sessions and storage reads that exceed 10 seconds return to courier-code entry with an error reference. Optional notification modules load after startup and cannot block the dashboard if the native module or Firebase setup is unavailable. Network/server load failures continue to show retry actions and now include error codes.

The latest ten diagnostic reports are kept locally under `courier101-error-reports`; the recovery screen shares only the current report when the user chooses Share error details. Reports include a reference, app version, OS version, screen, and redacted error/stack. No remote crash-reporting service is configured. OS/native process crashes or failures before the React Native runtime starts require Android Logcat/Play Console or iOS device crash logs and a new native build when applicable. JavaScript recovery does not guarantee recovery from those failures.

Regression tests deliberately throw rendering/startup/runtime errors and simulate corrupt and stalled storage. Run `npm test`, `npx tsc --noEmit`, and `npx expo export --platform all`. Publish a new Android/iOS binary to deliver these changes to store users.

To preview recovery in a local Expo development session, open Profile → Developer tools → Test error screen. Dismiss the development error overlay if it appears to see the app's recovery screen. Retry remounts Profile and clears the intentional failure. This control is guarded by `__DEV__` and does not appear in TestFlight or release builds.

## API configuration

### Store update reminders

Production native builds check the public `GET /api/mobile-app-release` endpoint on startup, when returning to the foreground, and every five minutes while active. Older installations show **Update available** with **Update now** (App Store on iOS, Google Play on Android) and **Later** (snoozes that version for 24 hours). Each version is prompted at most once per app launch. Store links fall back to the HTTPS listing if the native store cannot open, with a retry if both fail. Offline/invalid responses leave the app usable. Web, Expo Go and development mode skip reminders.

The check uses `expo-application` to read the installed binary's version, rather than an OTA manifest. Create a new native build to include this module and the reminder code. Apps shipped before this feature cannot display the reminder retroactively.

For each future release, increase `expo.version` in `app.json`, build and publish it, then announce its version in the Laravel backend's `MOBILE_APP_IOS_VERSION` and/or `MOBILE_APP_ANDROID_VERSION` after that platform's store rollout is complete. The versions are independent; an empty version disables reminders for that platform. Build numbers alone do not trigger reminders. Full release steps are in the Laravel repository's `docs/mobile-app-updates.md`.

Run `npm test` and `npx tsc --noEmit`. Verify the popup and actual store opening on physical iOS and Android release builds before distribution.

### API base URL

The default API is `https://courier101.com`. The EAS production profile also sets
this URL explicitly, so cloud builds work without the gitignored local `.env`.
The API URL is embedded in the app bundle; changing it requires a new release,
and clearing device storage does not change the address in an installed build.

For local API development, override the base URL in `.env`:

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
