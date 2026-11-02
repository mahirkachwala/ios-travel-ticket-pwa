# iOS Travel Ticket PWA

A modular mobile web prototype recreated from the supplied videos and photos. A fresh visit opens the main **Home** page, and the installed PWA also starts on Home. Choose Unreserved in Journey Planner to enter the booking flow. The three-screen booking flow selects a route, searches stations and sets journey options before generating the live ticket preview. The in-product company name remains **YOUR TRAVELS** and can be replaced independently of this project name.

This is a browser-local prototype: no travel operator, payment gateway, account server or ticket-validation service is connected. Running it locally does not publish it.

## Run and check

Use a current supported Node.js release. No dependency installation or build is required.

```sh
npm start
```

Open `http://127.0.0.1:4173`. The development server serves only `dist/` and listens on the local machine. Set `PORT` if a different port is needed.

```sh
npm run check
```

The check script validates the JavaScript syntax of the app, ticket components, journey screens, supplementary screens, config, timer and service worker. It is not an end-to-end browser test.

## Screens and behavior

- **Unreserved E-Ticket:** Normal/Season and Outside Station/At Station options, source/destination selection, route swapping, recent searches and Proceed To Book.
- **Search Station:** search the reference station list by name or code, select a result, or use a custom station name. Selection returns to route entry.
- **Unreserved Journey:** select train type, Journey/Return, passenger counts, class and concession. Expand the initially collapsed **Travel details** section to edit travel date, time, distance, via route and preview fare. **Book Now** applies the values to the active ticket; no reservation or payment is made. Fare Breakup shows the local preview calculation.
- **Booking Details:** a fresh five-minute countdown whenever an active ticket opens, including through View Details. The two-digit seconds group rolls downward over 400 ms while minutes and the colon stay fixed. The page includes ticket fields, notices, an enlargeable demo QR, connecting-journey entry, reference facts, five-star feedback and a 200-character description.
- **My Bookings:** Upcoming, Completed, Cancelled and All tabs; chronological sorting; Book Again and View Details. Both the ticket's Back button and browser Back return to Upcoming after generation. Completed reference tickets open the expired-ticket layout.
- **Home:** Journey Planner cards, More Offerings tiles, the upcoming journey, reference fact cards and social artwork. The bottom navigation opens Home, My Bookings, You and Menu.
- **You:** profile details and local editing, a demo wallet, profile completion, a local biometric preference, account tiles and local demo transaction history.
- **Menu:** Show/Hide Services, FAQs, Help & Support, Reserved Services - Counter, About, Rate Us, Share and Log Out. Unsupported live services explain their prototype status instead of contacting an external backend.

Closing journey entry or using My Bookings' Back button opens Home. Back from station search or journey options returns to route selection; the active ticket's Back button opens My Bookings. Ordinary reloads preserve the screen selected by the URL hash and restore saved ticket values. A service-worker update also preserves the current screen, booking tab and in-progress journey draft before refreshing the app.

Ticket values, profile details, preview branding, feedback, hidden-service preferences and demo wallet entries use browser local storage on the current origin. They are not synchronized between devices. Demo wallet additions do not take payment; the biometric switch does not enable device authentication. Profile editing updates the name and phone displayed on the ticket.

## Install and use offline

Serve `dist/` over HTTPS for phone installation. On iPhone or iPad, open the site in Safari and choose **Share → Add to Home Screen**. On Android or desktop, use the browser's **Install app** or **Add to Home screen** command when available. The desktop preview panel's **Install app** button opens the browser prompt when supported or shows installation instructions.

The service worker caches the app shell, scripts, styles, Montserrat font and image assets after a successful first load. Journey editing and UI previews then work offline. The local development URL works on the development machine; a plain HTTP LAN address does not provide the same secure-context PWA behavior. Native installation on a physical phone is a separate manual verification step.

## Optional Vercel deployment

Import the project folder into Vercel. The included `vercel.json` automatically selects the static configuration, runs the syntax check and serves `dist/`. Its effective settings are:

| Setting | Value |
| --- | --- |
| Framework Preset | **Other** |
| Root Directory | The folder containing this README and `package.json` |
| Build Command | **npm run check** |
| Output Directory | **dist** |
| Install Command | Default; the project has no package dependencies |

Vercel serves the contents of `dist/` directly after the check passes; there is no compilation step. `server.mjs` is for local development and is not the deployment entry point. The app uses hash navigation, so no SPA path rewrites are needed. No environment variables are required. The config also prevents stale caching of the service worker, HTML entry file and manifest. See [Vercel's build configuration](https://vercel.com/docs/builds/configure-a-build) for dashboard overrides.

## Customize the company and appearance

| File | Purpose |
| --- | --- |
| `dist/config.js` | `BRAND`, reference copy, ticket defaults and historical fixtures |
| `dist/typography.css` | Montserrat font face, measured type scale, spacing and responsive ticket layout |
| `dist/styles.css` | Base styles, mobile shell and desktop preview panel |
| `dist/components.js` | Shared header, ticket banner, QR/feedback, booking cards and expired details |
| `dist/journey.js` / `dist/journey.css` | Route entry, station search and journey options, including editable travel details |
| `dist/screens.js` / `dist/screens.css` | Home, profile, main navigation, side menu and supplementary screen content |
| `dist/app.js` | Navigation, local state, forms, dialogs and interaction handlers |
| `dist/timer.js` | Seconds-roll animation and countdown rendering |
| `dist/assets/` | Replaceable logos, watermark, ticket pattern, demo QR, home artwork, fonts and installation icons |
| `dist/manifest.webmanifest` | Installed application name, theme, scope and icons |
| `dist/index.html` | Browser title, metadata and application entry point |
| `dist/sw.js` | Offline cache and static-file allowlist |
| `vercel.json` | Static deployment output, syntax-check command and update-sensitive cache headers |

Change `BRAND.name`, `nameLocal`, `shortName`, `primary`, `logo`, `watermark` and `qr` to replace the operator branding. Home artwork can be overridden with `BRAND.homeAssets` keys `reserved`, `unreserved`, `platform`, `firstTrain`, `chenabBridge` and `social`. Optional `BRAND.socialLinks` keys are `X`, `Facebook`, `Instagram` and `YouTube`; use complete HTTPS URLs.

The desktop preview panel can change company name, color and logo on the current device. For changes that ship to everyone, edit the source config/assets. Update the manifest and PNG installation icons separately when changing installed-app branding. Clear saved preview branding if a previous local override masks new config values.

Montserrat is bundled in `dist/assets/fonts/Montserrat.ttf` with its license in `Montserrat-OFL.txt`. The family and dimensions were selected by comparing the reference photos; they are not a verified extraction of the original app's font file. [Google Fonts source](https://github.com/google/fonts/tree/main/ofl/montserrat).

## Updating the offline cache

Whenever application files change, increment `CACHE_NAME` in `dist/sw.js`. Add new static assets to `PRECACHE`; remove obsolete entries when deleting assets. The worker caches only known same-origin static resources and uses the network for other URLs. Navigation uses the network when available and falls back to the cached app shell offline. The app checks for a new worker without relying on the HTTP cache and refreshes after a new worker takes control.

For local troubleshooting, the browser's application/storage tools can clear this site's service worker, caches and local storage. Clearing storage also removes saved prototype data.

## Demo content and limits

The QR is a dense version-30 demo code with an explicit `valid_for_travel: false` payload. It is static and does not change with journey form inputs. Replace the QR asset or integrate a ticket-issuing API to produce real operator tickets. The prototype does not reserve seats, issue valid travel credentials, validate passengers or process payments.

Railway-related labels and facts are retained from the supplied references and can be changed for the bus company. The completed-history dates are reference fixtures, despite the reference's “last 45 days” subtitle. Small ambiguous IDs and unobserved historical details are documented as demo defaults in `config.js`. Home artwork is reference-derived and replaceable through the asset settings.
