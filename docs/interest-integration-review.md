# Interest-driven Campus screen — local review

Review date: November 14, 2026.

## Release status

Implemented in the actual Expo Campus route (`src/app/explore.tsx`), not only
the standalone interests prototype. Local review only: no Git push, Railway
deployment, Expo build, or App Store submission for this candidate. Previously
released build 21 remains unchanged. Physical iPhone, glasses, background audio,
GPS arrival, and campus walking tests have not been performed for these changes.

## User flow

1. Select academic and campus interests; search filters the available choices.
2. The single S&T illustration highlights matching buildings. Matching-interest
   counts express relevance; shared buildings appear once. Internal building
   coordinates remain available without showing every building marker.
3. Remove individual unwanted stops and preview the route. Havener is always
   the start. There is no artificial destination cap.
4. Tour-order numbers and category colors appear on the same illustrated map.
   The existing traced artwork network supplies its visual lines. Tunnels are
   cyan; assumptions and connection gaps are disclosed.
5. Start a geographically connected tour using the existing tour controller,
   navigation, narration, GPS, and voice-command plumbing. Browser testing uses
   manual controls, not simulated glasses audio or simulated location.
6. Active personalized tours restore paused after reload, preserving stops,
   interests, exclusions, artwork, geographic route and current stop.

The geographic pedestrian graph, not image pixels, determines route ordering,
distances and walking instructions. Small selections use exact open-route
ordering for mapped approaches; selections above eleven total stops use the
existing nearest-neighbor heuristic and are not advertised as globally optimal.
Missing geographic approaches block walking start but retain selected stops for
review. Artwork gaps never become invented straight-line shortcuts.

## Reused data and implementation

- `backend/src/data/artwork-layout.json` snapshots the existing prototype's
  `/map-layout` result, including matched official building numbers and image
  positions. It aligns to the bundled 3114 × 1746 artwork in
  `preview/campus-tracing-source.png`; it is not a GPS projection.
- `backend/src/data/artwork-network.json` snapshots the output of
  `scripts/artwork-preview-network.cjs` (graph plus reviewed approaches).
- `backend/src/services/artworkRouting.js` migrates the existing
  `scripts/artwork-routing.cjs` algorithm into the deployable backend, preserving
  its gap handling and assumptions. The original prototype remains separate.
- These snapshots must be deliberately refreshed and tested when trace edits
  are approved. The running API does not fetch the prototype or scrape the map.
- `/interests` returns the catalog and layout. `/interests/plan` validates choices
  and returns personalized stops, geographic route and independent artwork.
- Backend compilation includes the JS routing helper and JSON snapshots, so
  deployment from the backend directory does not depend on root preview scripts.
- `campus-history` and the History degree have distinct IDs; choosing landmarks
  does not silently select the academic History program.

## Validation

- TypeScript app check and backend compilation passed.
- 73 app service tests and 45 backend tests passed.
- 10 existing artwork routing tests passed.
- Expo static web export passed using the local API, without cloud submission.
- Browser: CS + Electrical Engineering generates four stops, approximately
  1,252 m / 16 minutes; numbered route is drawn directly on the illustration.
- Browser: start, advance to stop two, reload into a paused tour, and end worked.
- Browser: broad selections retained all matches and displayed a geographic-gap
  message with Start disabled rather than silently failing.
- Browser: collapsible stop list and detailed map assumptions worked.
- A screenshot of the integrated map is saved at
  `preview/interest-campus-integrated.jpg`.

## Review and remaining limits

Open http://localhost:4177/explore while the local API on port 3000 and Expo
static server on port 4177 are running. Try Computer Science plus Electrical
Engineering, then other interests and explicit stop removals.

This does not complete geographic coverage for every campus building. Broad
campus-life selections can still include buildings outside mapped approaches;
the app reports those gaps and blocks walking start. Final entrances,
crossings, accessibility, route accuracy, mobile layout and real-device audio
need further review before release. Draft selections survive tab changes but
only started tours are persisted across a full reload.
