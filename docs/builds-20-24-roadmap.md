# ClioVision: Builds 20–24

Scope approved September 30, 2026. Build 19 is the baseline. These are release
targets, not claims that the features have shipped. Each release needs automated
checks, a change summary, and on-device acceptance testing. Expo submission is
a separate release gate; do not infer blanket submission approval from roadmap approval.

## Build 20 — Voice controls and conversation reliability

- Let users preview and select installed female iOS voices and adjust speech speed.
- Apply the same settings to greetings, answers, camera descriptions, and tours.
- Clearly distinguish listening, capturing a question, thinking, and speaking.
- Prevent duplicate requests and stale callbacks during repeated questions.
- Test ten consecutive questions, interruption, background/foreground, and glasses reconnection.

Acceptance: selected voice persists after restart; answers remain visible when
speech fails; each question produces at most one request; listening resumes after speech.

## Build 21 — Walking pilot reliability

- Strengthen existing GPS arrival detection with fresh, distinct readings and dwell time.
- Preserve pause/resume and replay; provide an explicit manual skip/arrival action.
- Show the next stop, distance, GPS quality, and off-route guidance without implying precision the sensor lacks.
- Walk and validate the Computer Science pilot's sidewalks, crossings, entrances, and stop positions.

Acceptance: simulated noisy/stale GPS cannot trigger arrival; paused tours do not
advance; a real campus walk confirms route geometry. Field verification remains
pending until someone completes the walk; do not label the route verified beforehand.

## Build 22 — Camera identification trust and feedback

- Retain the “Clio, what am I looking at?” workflow.
- Reject stale or inaccurate positioning as evidence for visual recognition.
- Explain uncertain matches and offer retry instead of asserting a building identity.
- Add incorrect-identification feedback with explicit privacy expectations.
- Curate sourced history, use, and fun facts for the pilot's buildings.

Acceptance: test multiple viewpoints and unrelated scenes; uncertain scenes are
not confidently identified. Camera images are not retained or shared for feedback
without explicit consent. Recognition is not a substitute for safe navigation.

## Build 23 — Offline resilience and diagnostics

- Cache public tour stops, route geometry, and facts with timestamps and clear offline labels.
- Restore saved tour progress in a paused state after restart.
- Preserve pairing during temporary network/server failures.
- Bound request duration; offer deliberate retry without duplicate submissions.
- Provide shareable diagnostics that exclude credentials, transcripts, and images by default.
- Distinguish configured providers from a successfully tested AI request.

Acceptance: airplane-mode testing preserves pairing and tour progress; cached
information is marked as cached; AI features clearly report that connectivity is needed.

## Build 24 — Onboarding, accessibility, and Android readiness

- Guide pairing, permissions, glasses connection, voice setup, and first tour.
- Improve screen-reader labels, scalable text, contrast, and touch targets.
- Audit Android voice, camera, Meta SDK, permissions, and lifecycle parity.
- Release Android only after real-device tests; do not equate a successful compilation with parity.
- Expand tours only as building facts and pedestrian routes are reviewed.

Acceptance: a new tester completes setup without developer assistance; core
controls are screen-reader accessible; Android-specific gaps are explicitly documented.

## Implementation log

- October 5: pairing and refresh responses now validate nonempty tokens and usable
  finite expiry before replacing credentials. In-memory activation occurs only after
  secure storage succeeds. Added malformed-session and field-allowlist regression
  tests. This does not yet resolve disconnect-versus-refresh concurrency; native
  secure-storage failure testing and release validation remain pending.

- October 5: shared API response parsing now rejects malformed JSON and null/scalar
  success bodies instead of returning an empty object. HTTP failure status is preserved
  even for HTML or null error bodies, so authentication handling remains consistent.
  Added parser regression tests. This is envelope validation, not complete endpoint
  schema validation; native/device verification and deployment remain pending.

- October 4: Voice Debug now offers a paired-user, manual AI observation check
  with a 15-second deadline and duplicate-tap guard. Only known status text is
  rendered; unsupported/failed checks have a deliberate retry message. The UI
  states this is a server-wide historical snapshot, not a live provider probe,
  and sends no question, photo or audio. Full checks pass: 28 app tests, 24 backend
  tests, app typecheck and backend compilation. Native UI validation and deployment
  remain pending; no Expo submission performed.

- October 4: checkpoint recovery now validates nested route coordinates, legs,
  steps and distance/duration fields. Invalid route geometry is discarded while
  valid saved tour progress can still restore paused. Added malformed-route tests.

- October 4: added screen-reader labels to pairing/question inputs and the
  icon-only Send button, with a question-entry hint and disabled/busy states.
  Wake toggle now exposes its disabled state. Device screen-reader and large-text
  testing remain pending; no accessibility-compliance claim is made.

- October 3: manual End tour immediately pauses tracking and stops tour narration,
  then clears the local active tour/checkpoint even if backend confirmation fails.
  An explicit notice distinguishes a local end from a confirmed backend response;
  no silent retry or synchronization claim. Automatic completion reconciliation
  and new offline tour starts remain separate work.

- October 3: save active tour/stop locally and restore paused after restart, scoped
  to the API origin with seven-day checkpoint expiry. Saves are serialized and
  ending a tour clears the checkpoint. No microphone or GPS starts on restoration.
  Storage failures are shown to the user. Offline start/end reconciliation and
  real-device restart testing remain pending.

- October 3: pausing a tour now stops its pending narration and resets its speech
  state. Removed the tour's unconditional wake-listener restart after narration;
  Ask Clio retains ownership of the user's listening preference. Native pause/audio
  and wake-toggle interaction tests remain pending on the phone.

- October 3: completed a source-based Android readiness audit in
  `docs/android-readiness-audit.md`. Confirmed the local wearable module is Apple-only,
  and Android wake/camera/native answer speech/tour narration are not implemented.
  Shared API, caching and GPS paths exist but are not Android-device verified.

- October 2: hardened public-cache failure handling. If browser cryptography is
  unavailable, live loading still works without caching. Added regression tests
  for full storage, unreadable/missing/corrupt cache, fallback dates, and preserving
  the original network error. Device filesystem/airplane-mode checks remain pending.

- October 2: added 15-second deadlines to pairing and tour start/end, and
  45-second deadlines to transcription and server speech generation. No automatic
  replay of these operations. A timed-out request may still have reached the server;
  offline session reconciliation remains future work.

- October 2: public catalog, stop and route responses are cached per API origin/path
  with timestamps and a 30-day maximum age. Network failures/timeouts can fall back
  to saved data with a visible warning. Live responses survive cache-write failure.
  No auth or camera data is cached. Offline start/progress restoration and device
  airplane-mode verification remain unfinished; this is browse-only fallback.

- October 2: added user-initiated diagnostic sharing with an explicit field
  allowlist: connection state, phase, and most recent request outcome/duration.
  Excludes credentials, raw logs, questions/answers, photos, location, and device
  names. Nothing is uploaded automatically. App typecheck and two allowlist tests
  pass; native share-sheet testing remains pending.

- October 1: added an expandable first-use guide with live pairing, glasses, and
  wake-mode status. Covers permission prompts, voice preview, camera privacy,
  tour starting point, internet requirements, and unverified route warnings.
  Clearly labels native glasses features as iOS-only outside iOS. This is guidance,
  not completed Android parity or a substitute for new-user device testing.

- October 1: session refresh now shares concurrent requests and has a 15-second
  deadline, preventing startup from waiting indefinitely on an unreachable backend.
  Failed refresh attempts do not stay cached. Offline tour caches and progress
  persistence are still pending; this is not a complete offline mode.

- October 1: question and camera API operations now have a 45-second deadline,
  including response parsing, with an actionable timeout message and abort signal.
  No automatic retry is added. Other API operations and offline caches remain pending.
  Deadline tests cover success, failure, hanging work, body processing, and no retries.

- October 1: camera results now say Possible match rather than presenting a model
  confidence score as certainty. Unmatched scenes have an explicit uncertain state.
  Added local dismissal and deliberate new-photo retry, with clear disclosure that
  dismissal is not an uploaded report. Dismissed facts/sources are removed so replay
  does not repeat the rejected identification. Real-image testing remains pending.

- October 1: Build 22 camera requests omit GPS fixes older than 15 seconds,
  future timestamps, accuracy worse than 50 meters, and malformed coordinates.
  Optional GPS collection stops blocking after four seconds; photo identification
  proceeds without coordinates. App typecheck and 11 location/navigation tests pass.
  Camera uncertainty/feedback UI and real-image acceptance tests remain unfinished.

- September 30: Build 21 arrival tracker now requires three distinct fresh fixes
  over eight seconds. Stale/future fixes, unreliable accuracy, departures, and long
  gaps reset confirmation. Stationary location updates are requested for dwell.
  App typecheck and eight navigation tests pass. Physical campus validation remains pending.

- September 30: Build 20 voice controls implemented: installed female voices,
  Automatic selection, three speed presets, persisted native preferences, and a
  preview that preserves the answer. Fixed stale wake callbacks and overlapping
  request handling. Native iOS compilation and device acceptance tests pending.
- September 30: app typecheck and backend build pass; 23 backend tests and five
  navigation tests pass. App typecheck now excludes the separately compiled backend
  and test files. Restored backend dependencies from the lockfile; npm reports four
  dependency advisories (one moderate, three high), requiring separate review.

- September 30: audited current tour controls and voice pipeline. Existing
  pause/resume, replay, and GPS checks will be enhanced rather than duplicated.
- September 30: changed session restoration to preserve the refresh token on
  network/server failure. Only an explicit HTTP 401 clears pairing. Not deployed.

## Release checklist (repeat for each build)

Local validation: install the root and backend lockfiles with `npm ci` and
`npm --prefix backend ci`, then run `npm run check` from the repository root.
This fail-fast command runs app typechecking, app-service tests, backend compilation,
and backend tests. It does not compile Swift, build Android, submit EAS, or replace
visual/accessibility/device testing.

October 3 checkpoint: 25 app-service tests and 23 backend tests pass, with app
typecheck and backend compilation passing. The work remains local, not deployed.
The roadmap is not complete: native/device validation, Android implementation,
field verification, further accessibility review, and provider operational health
reporting remain open. Cached browsing and paused checkpoint recovery are implemented;
new offline tour starts and backend end reconciliation are not.

October 4: added authenticated `/ai-guide/status` observations distinguishing provider
responses, retrieval-only answers, failed requests, and no requests observed. Observations
expire after five minutes and describe only the current server process, not a live probe.
Public health now explicitly distinguishes credential presence from operational health.
No prompts or credentials are included. App integration and production verification remain
pending; these changes are local and do not change Railway until deployed.

1. Typecheck and targeted regression tests pass.
2. Review changes for secrets, privacy, and unrelated work.
3. Commit the scoped changes; record the commit and deployment status.
4. Submit an Expo build when authorized; record the actual EAS build identifier.
5. Test on the phone and glasses, then record results and unresolved limitations.

Usage resets do not guarantee an exact resume time. A scheduled continuation may
attempt to resume, subject to account limits and the desktop scheduler being available.
