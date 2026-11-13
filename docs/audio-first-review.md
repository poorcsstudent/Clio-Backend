# Audio-first review and physical acceptance

Local implementation candidate. Nothing has been deployed or submitted to Expo.

## Observed browser results — 2026-11-12

Passed: Computer Science route start (987 m geographic route), GPS-loss hold,
mock camera refusal to invent a turn with uncertain position, pause/resume,
TJ tunnel entry wording, three-reading off-route warning, blocked off-route
arrival, eight-second simulated arrival dwell, and optional illustration display.
No browser console errors were observed. Expanding the illustration initially
caused horizontal page overflow; corrected and verified at the current viewport
(content width 1265 px, viewport 1265 px). This is not a physical-device test.

## Five-minute browser review

Open http://localhost:4176/audio-test after `npm run preview:audio`.

1. Start Computer Science → Kummer. Advance GPS checkpoints and inspect the
   geographic maneuver list. This is the real graph with simulated positions.
2. Enable browser speech if desired. Its voice is not the native iOS voice.
3. Simulate GPS loss. “Use the camera” must remain a labeled mock and must not
   supply a turn from the uncertain position. Recover GPS to continue.
4. Type “pause the tour”, then “resume the tour”. Updates stop while paused and
   resume requires a new fix. Try repeat, how far, next stop and end the tour.
5. Simulate off-route movement. There must be no straight-line shortcut, guessed
   heading or declaration that traffic is safe.
6. Confirm arrival dwell: three distinct simulated samples spanning eight
   seconds advance the tour. This is not proof of a real campus arrival.
7. Select either residential route. Inspect the tunnel instructions: beneath
   the road, GPS may be unavailable, wait for a new fix after exiting.
8. Expand the optional campus illustration. It is a visual aid only; no fake
   live GPS dot or geographic route is projected onto the unscaled artwork.

## Native build prerequisites (approval still required)

- The new Expo TaskManager dependency and background-location entitlements
  require a new binary. This cannot be validated through an old installed app.
- The correlated native speech method also requires that new binary. Do not ship
  this JavaScript as an OTA to the older bridge. Swift was source-reviewed only;
  Xcode compilation and device validation are still required.
- Deploying new backend maneuver generation is a separate approved action.
- Configure the test build to a suitable backend; do not assume the current
  production API already serves these new maneuver fields.
- Check iOS Always location permission, foreground permission denied, background
  permission denied, service disabled, and consent disabled paths.

## Physical acceptance checklist — not performed by Codex

- Walk CS/Kummer and residential/tunnel approaches with a sighted tester watching
  the route. Check all entrance associations, closed paths and crossing choices.
- Verify instructions match travel direction in both directions; a stationary
  phone or single glasses image does not measure head orientation.
- Lock the phone for at least ten minutes: cues, arrivals, wake availability,
  battery use, Bluetooth reconnect and audio interruptions must be recorded.
  Background wake listening is currently not supported; do not advertise it.
- Ask a campus question during a tour; tour narration must not interrupt capture
  or the answer. Then verify guidance resumes without stale queued turns.
- Pause/end from voice and screen, switch tabs, kill/relaunch the app, and confirm
  location stops and restores paused. Verify the OS location indicator.
- Rapidly pause/resume while location startup or a permission prompt is pending.
  Old callbacks must not restart tracking or produce arrival cues; a fresh fix is
  required. Check that a failed background stop produces a visible warning.
- Interrupt speech, start a new answer, and verify a late cancellation from the
  old utterance does not clear the new answer. Test cancellation before speech
  starts, native stop failure, and returning to wake listening after completion.
- Enter/exit both underpasses. No turn or arrival should advance on stale GPS.
- Test one requested camera snapshot, denied permission, cancelled consent,
  failed upload, unmatched landmark, and a tour changed during analysis. Check
  temporary files are removed and no photo is captured for plain “directions”.
- Check accessibility separately. Stairs and currently unverified approach gaps
  mean this is not an accessible-routing product yet.

## Known scope boundaries

The native app still uses its existing degree-tour catalog; the interest-driven
artwork editor remains a separate web prototype. This roadmap adds audio-first
navigation and camera context, not a hidden migration of that prototype into
the native catalog. Illustrations are not route geometry. The website and
production app remain unchanged until explicit release approval.
