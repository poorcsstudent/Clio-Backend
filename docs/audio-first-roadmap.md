# Audio-first walking tour implementation

Implementation approved 2026-11-12. Production release approved 2026-11-13;
see `release-2026-11-13.md` for actual deployment and iPhone build status.
The local-review notes below are historical; physical acceptance remains open.

## Milestones

1. Geographic maneuver generation: implemented locally. The pedestrian graph
   yields contiguous maneuver paths, turns, stairs, marked crossings, and tunnel
   entry/exit prompts. Shared approach nodes do not fabricate a walking segment.
2. Timed guidance: implemented locally. Advance prompts, quiet time, duplicate
   suppression, conservative progress matching, repeated off-route evidence and
   stale/inaccurate GPS holds. Arrivals require fresh fixes, <=25 m reported
   accuracy, non-uncertain route progress where a leg is active, and eight-second
   dwell. Physical cue timing is not validated.
3. Voice controls and speech coordination: implemented locally. Repeat current
   instruction, pause/resume, skip, end, distance and directions. Tour state is
   owned above the tabs. One replaceable, expiring tour utterance waits behind
   question capture/answers; cancelled preparation cannot resume later.
4. Opt-in background location: implemented locally using Expo TaskManager and
   session-scoped permission choice. Pause/end detaches the consumer and stops
   updates. Cold-started tasks stop; saved tours restore paused. Actual iOS
   suspension, audio routing, battery use and locked-phone behavior remain gates.
   Wake commands still require the app open; background wake listening is NOT
   claimed. Android glasses narration is not implemented by this iOS speech path.
5. On-demand camera-assisted directions: implemented locally. Say “use the
   camera” during a tour; the first request asks for session consent. Ordinary
   directions do not take a photo. One snapshot is sent via the existing secure
   vision endpoint, not streamed to an administrator. The result identifies a
   possible landmark; a deterministic composer separately presents the current
   geographic instruction only with fresh, on-route position. No heading or
   crossing-safety inference. Local cache deletion occurs in finally; provider
   processing/retention is not claimed to be zero.
6. Web rehearsal: implemented at http://localhost:4176/audio-test. Browser speech,
   location and camera scenarios are labeled simulations. The optional S&T
   illustration is also bundled in the app as a pan/zoom reference, without
   invented GPS placement. TypeScript, app/backend tests and Expo web export pass.
7. Physical campus pilots (CS/Kummer and residential underpass): user testing
   required; cannot be completed in the development environment.

## Validation and review handoff — 2026-11-12

- 59 app tests, 39 backend tests and 10 artwork-routing tests pass (108 total).
- `npm run typecheck`, backend TypeScript build and `npm run export:web` pass.
- Browser checks: CS route start, uncertainty with mock camera, pause/resume,
  TJ tunnel entry/exit instructions. Additional final checks are recorded in
  `docs/audio-first-review.md`.
- This is a local review candidate, not a released build. No production push,
  Railway deployment or Expo submission has been made for this roadmap.
- Review approval can authorize the next native test build; it is not evidence
  that the hardware/campus acceptance gate has passed.

## Reliability hardening — 2026-11-13

- Serialized background-location ownership prevents delayed cleanup from stopping
  a replacement session. Failed stops are surfaced instead of silently ignored.
- Pause, resume, stop and stop changes invalidate old location callbacks. Cached
  pre-resume fixes and delayed permission results cannot restart an old session.
- Native answer events carry playback IDs so a late cancellation cannot clear a
  newer answer. This bridge change requires a new approved native binary, not an
  OTA update onto the old build.
- 70 app tests, 39 backend tests and 10 artwork-routing tests pass (119 total).
  TypeScript, backend compilation and Expo web export pass. The new regression
  tests cover pure lifecycle/event coordination; they are not native device tests.
- Swift source was reviewed but cannot be compiled on this Windows host. iPhone,
  glasses and campus validation remain outstanding. No release was submitted.

## Restart the local test

From the repository root run `npm run preview:audio`, then open
http://localhost:4176/audio-test. It binds only to this computer's loopback
interface; it is not a public or phone-accessible hosted preview. No secrets or
live AI requests are needed. The pre-existing interest map is a separate preview.

## Release contract

The geographic pedestrian graph controls navigation. The illustrated map is
optional and cannot establish distances, turns, facing direction or arrivals.
Do not call this field-verified, accessibility-verified, or background-reliable
until the relevant physical tests pass. Missing path/entrance coverage remains
explicit. Do not claim that a road is safe to cross based on camera analysis.

## Resume policy

Keep scoped changes and validation results here and in Git. Never redeem credits
or change plans. Usage exhaustion is not completion; resume when access permits.
A weekly limit may not reset after five hours. No scheduled polling automation
is created to track this implementation.
