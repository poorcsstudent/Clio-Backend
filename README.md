# ClioVision

ClioVision is a cross-platform campus guide for iOS, Android, web, and connected Meta AI glasses. The mobile app records a visitor's question, sends it through an authenticated backend, retrieves the most relevant verified campus records, produces a grounded answer, and plays generated speech over the phone's active audio route.

## What is implemented

- Expo SDK 56 app shared by iOS and Android
- Secure device pairing with 15-minute access tokens and 7-day refresh tokens
- Refresh-token storage in iOS Keychain / Android Keystore through Expo SecureStore
- Campus retrieval over the structured Missouri S&T data
- OpenAI Responses API integration with a retrieval-only fallback when no API key is present
- Authenticated speech-to-text and text-to-speech endpoints
- In-memory audio handling, upload limits, MIME validation, expiring speech URLs, and rate limits
- EAS build profiles for development, preview, and production

This uses retrieval-augmented generation (RAG), not model fine-tuning. Campus facts change and must remain traceable, so retrieval is safer and easier to update than “training” facts into model weights.

## Configure the backend

Copy `backend/.env.example` to `backend/.env`, then replace every placeholder:

```text
CLIO_JWT_SECRET=<at least 32 random characters>
CLIO_DEVICE_ENROLLMENT_CODE=<private code entered once in the app>
OPENAI_API_KEY=<server-side OpenAI API key>
```

The OpenAI key is optional for retrieval-only text testing. It is required for real model answers, speech recognition, and generated speech.

Start the API:

```bash
cd backend
npm install
npm run build
npm test
npm run dev
```

## Configure the app

Copy `.env.example` to `.env.local` and point it at the API. A physical phone must use the computer's LAN address during local development; `localhost` refers to the phone itself.

```text
EXPO_PUBLIC_CLIO_API_URL=http://192.168.1.20:3000
```

Production must use an HTTPS URL.

```bash
npm install
npm run typecheck
npm run doctor
npm start
```

Open the app, enter `CLIO_DEVICE_ENROLLMENT_CODE`, and pair. The code is exchanged for tokens and is not stored by the app.

## Campus knowledge

The official campus-map records are in `backend/src/data/campusPlaces.ts`. Degree definitions, program-to-building access rules, and graph construction are in `backend/src/data/degreeTours.ts`. The backend currently exposes:

- 33 undergraduate degree tours from the 2025-2026 Missouri S&T catalog
- one general campus-life tour
- Havener Center as the root of every degree route
- 28 permission-mapped campus nodes shared across the degree graph
- program-specific stop order, relevance, audio scripts, catalog links, and map coordinates

For each degree, Clio builds a minimum-distance access graph using only relevant buildings and runs a best-first proximity search from Havener. `GET /campuses/missouri-s-and-t/tours` returns the catalog, `GET /campuses/missouri-s-and-t/stops?tourId=<degree-id>` returns an ordered route, and `GET /campuses/missouri-s-and-t/tour-graph/<degree-id>` exposes its graph.

After changing the campus records, run:

```bash
cd backend
npm run knowledge:check
npm test
```

Answers include the retrieved sources. When the data does not cover a question, the assistant is instructed to say so instead of inventing a fact.

## Build iOS and Android

Cloud builds are the practical path from Windows because EAS performs iOS builds on macOS infrastructure:

```bash
npx eas-cli@latest login
npx eas-cli@latest build:configure
npm run build:all
```

Store builds additionally require Apple Developer Program and Google Play signing credentials. Update the bundle/package identifier in `app.json` if `com.cliovision.guide` is not the identifier registered to your accounts.

## Meta glasses

For the current audio MVP, pair the glasses to the phone and select them as the active Bluetooth microphone/output route. The app records and plays through the operating system audio session.

Native Meta Device Access Toolkit registration still requires a Meta Wearables developer organization, Meta app ID, release channel, GitHub package access, and physical-device testing. See `docs/META_GLASSES.md` for the integration boundary and `docs/SECURITY.md` for the production threat model.
