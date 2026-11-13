# Android readiness audit

Source inspection: October 3, 2026. This is not an Android device-test report.
The presence of Android Expo configuration does not mean wearable feature parity.

## Current implementation

| Capability | Evidence in this checkout | Release status |
| --- | --- | --- |
| App package and microphone setup | `app.json` declares Android package, audio permissions and Expo Audio plugin | Configured; build/device verification pending |
| Pairing and authenticated API | Shared `src/services/api.ts`; SecureStore used outside web | Implemented shared path; Android test pending |
| Public tours and cached browsing | Shared API, filesystem cache, and Campus screen | Implemented shared path; Android storage/UI test pending |
| GPS arrival detection | Campus screen runs location tracking on non-web platforms | Implemented shared path; Android permissions/background behavior unverified |
| Meta registration and camera | Local module config registers Apple modules only; JS loads module only on iOS | Missing Android native implementation |
| Hey Clio and command capture | Swift Speech framework bridge; JS module is iOS-only | Missing Android native implementation |
| Native answer speech | `startNativeAnswerSpeech` requires the iOS module | Android output missing, including after successful text answers |
| Tour narration | `speakTourGuidance` returns early outside iOS | Android narration missing |
| Voice preferences | Installed iOS voices and UserDefaults | Requires Android implementation and voice availability handling |

## Required implementation sequence

1. Confirm the supported Android Meta SDK installation and registration workflow
   against current official SDK documentation before adding dependencies. Do not
   copy Apple frameworks or assume matching permissions/API signatures.
2. Implement Android module registration, wearable state events, callback handling,
   camera permission and one-shot capture behind the existing TypeScript contract.
3. Implement a foreground speech state machine and Android TTS, including stop,
   cancellation, completion events, voice preferences, and audio-focus ownership.
   Explicitly handle the absence of an on-device recognizer or installed voice.
4. Coordinate microphone capture, TTS and camera transport. Route detection must
   distinguish a connected wearable from the actual selected audio output.
5. Replace iOS-specific user-facing instructions when Android functionality lands.
   Do not remove the current limitations warning before native support is working.
6. Review the generated Android manifest and SDK-required permissions. Test denied,
   revoked and approximate-location permissions; request only what each feature needs.

## Hardware acceptance matrix

Record phone model, Android version, glasses firmware, app build and result for:

- Fresh installation and private pairing; rejected and expired credentials.
- Ten consecutive wake/question/answer cycles without retapping or duplicate requests.
- Phone speaker versus glasses audio, Bluetooth disconnect/reconnect, audio interruption.
- Camera permission denied/granted, unclear scene, successful match and retry.
- Foreground/background transitions, screen lock and process restart.
- Tour pause/resume/manual arrival, GPS drift and stale fixes.
- Airplane mode after caching, cache-write failure and network recovery.
- TalkBack, large text, touch targets and readable error messages.

No Android release or parity claim until these are tested. Tests requiring a phone,
glasses or campus walk remain user-assisted; they cannot be replaced by TypeScript checks.
