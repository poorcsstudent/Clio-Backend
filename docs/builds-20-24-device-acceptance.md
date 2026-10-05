# Builds 20–24: device acceptance record

Status: NOT RUN. This document is a test plan, not evidence of a passing release.
Do not submit an Expo build without explicit release approval. Automated checks
do not compile the native modules or establish phone/glasses compatibility.

## Record before testing

- Tester and date:
- Git commit and EAS build ID:
- iPhone model / iOS version:
- Glasses model / firmware:
- Network (Wi-Fi or cellular; no SSID needed):
- Backend deployment commit:
- Selected voice / speed:

Use Pass / Fail / Not run for each row. Include sanitized observations and timing.
Never attach enrollment codes, tokens, API keys, private conversations, or bystander
images. The in-app shared diagnostic summary excludes raw transcripts and photos;
screenshots of raw Voice Debug may not.

## Voice and conversation

| ID | Procedure | Expected result | Result |
| --- | --- | --- | --- |
| V1 | Select an installed voice and speed, preview, restart app | Preference persists; preview does not replace the answer | Not run |
| V2 | Ask ten different campus questions, waiting for completion | One answer per question; answer remains visible; listening resumes when enabled | Not run |
| V3 | Compare greeting, answer, camera description, and tour speech | Selected voice/speed applied; audible output route documented | Not run |
| V4 | Disable Hey Clio, then replay a tour narration | Listener does not restart against the user's preference | Not run |
| V5 | Background/foreground during listening and during speech | No crash, duplicate question, or stuck busy indicator; actual recovery documented | Not run |
| V6 | Disconnect/reconnect glasses during an answer | Answer text survives; audio failure/recovery is visible; no duplicate submission | Not run |
| V7 | Record silence, then a valid short question | Silence gets retry guidance; next recording works | Not run |

## Tour, location, and recovery

| ID | Procedure | Expected result | Result |
| --- | --- | --- | --- |
| T1 | Begin Computer Science tour at Havener, pause, move near next stop | Paused tour does not advance or narrate | Not run |
| T2 | Resume and dwell at a stop with reliable GPS | Arrival requires distinct fresh readings over dwell interval | Not run |
| T3 | Deny location permission or test poor accuracy | Clear guidance; no false arrival; manual controls remain available | Not run |
| T4 | Restart mid-tour | Correct stop restores paused; no automatic microphone/GPS start | Not run |
| T5 | Load tours online, then use airplane mode | Cached data is labeled; pairing is not erased by network failure | Not run |
| T6 | End an active tour while offline | Local session/checkpoint clears; backend confirmation is not falsely claimed | Not run |
| T7 | Reconnect after T5 and ask a question | Deliberate retry succeeds without requiring new pairing for a mere outage | Not run |

Field walk: record each leg's sidewalks, crossings, construction, entrance access,
and actual stop location. Stop following the suggested route if it conflicts with
posted conditions. Record corrections separately; do not mark the route verified
until the complete route has been checked. Do not infer accessible routing from
successful GPS arrival or route geometry alone.

## Camera trust

| ID | Procedure | Expected result | Result |
| --- | --- | --- | --- |
| C1 | Identify each pilot building from multiple public viewpoints | Compare with known identity; record misses, not just successes | Not run |
| C2 | Capture an unrelated scene without people/private details | Does not confidently assert a campus identity; uncertainty/retry is available | Not run |
| C3 | Deny location permission and repeat identification | Camera workflow can proceed without location evidence | Not run |
| C4 | Reject a possible match, then replay/retry | Rejected facts disappear; retry requires a new photo; no automatic feedback upload | Not run |
| C5 | Deny camera permission, then recover via settings | Actionable error and no stuck busy state | Not run |

## Diagnostics, onboarding, and accessibility

| ID | Procedure | Expected result | Result |
| --- | --- | --- | --- |
| A1 | New tester follows setup guide unaided | Completes pairing, voice preview, first question and first tour; difficulties recorded | Not run |
| A2 | Use VoiceOver through pairing, question, camera and tour controls | Labels/states meaningful; focus order usable; actions reachable | Not run |
| A3 | Increase text size and test a narrow phone layout | No clipped essential instructions or unreachable controls | Not run |
| A4 | Share diagnostic summary to a tester-controlled destination | Review payload first; excludes credentials, raw logs, transcripts, location and photos | Not run |
| A5 | Check AI observations before/after a request and on an older backend | Configuration not equated with live health; unsupported check fails clearly | Not run |

## Release decision

- Automated validation command: `npm run check` (record result and commit).
- Native iOS compilation: Not run for this roadmap unless a build ID is recorded.
- Physical phone/glasses acceptance: Not run.
- Campus field verification: Not run.
- Android: not supported by the current native wearable implementation; see
  `android-readiness-audit.md`. Do not reuse iOS results as Android evidence.
- Open failures / severity / owner:
- Explicit release approval and scope:

Known implementation work remains, including disconnect/refresh concurrency and
further lifecycle/accessibility review. This checklist does not imply those gaps
have been fixed, nor does completing documentation satisfy acceptance testing.
