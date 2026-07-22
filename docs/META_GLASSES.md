# Meta AI glasses integration

## Implemented iOS developer-mode path

ClioVision now includes a native Expo module around Meta Wearables Device Access Toolkit (DAT) Core v0.7.0. The iOS app can:

- launch the registration handoff to the Meta AI app;
- process the `cliovision://` callback;
- show DAT registration state;
- discover registered glasses and show their link state, model, and compatibility; and
- unregister the integration.

Developer Mode uses `MetaAppID` value `0`, so the first physical-device test does not require a release channel. Before external distribution, replace that value with the project App ID and finish the iOS configuration in Meta Wearables Developer Center.

The official `MWDATCore.xcframework` is vendored under the local Expo module and pinned to tag `0.7.0`. Its upstream `LICENSE` and `NOTICE` files are included alongside the module. This keeps EAS builds deterministic while the Expo project remains generated/prebuild-based. Meta v0.8.0 currently ships a Swift 6.3.2 development-compiler interface that Expo's Xcode 26.4 image cannot import; v0.7.0 uses Apple Swift 6.2.3 and retains the registration/device APIs required for Ray-Ban Meta glasses.

## Voice audio path

DAT does not provide a separate audio SDK. ClioVision continues to use `expo-audio`; iOS chooses the active Bluetooth microphone and output route. With the Ray-Ban Meta glasses connected as an iPhone audio device, Clio records the question and plays generated speech through that route.

No backend token, enrollment code, OpenAI key, or Meta credential is sent to the glasses. The app stores only its short-lived Clio device session in iOS secure storage and communicates with the backend over HTTPS.

## Required setup on the iPhone

1. Pair the glasses in the Meta AI app and in iOS Bluetooth settings.
2. Enable Developer Mode in Meta AI.
3. Install the Meta-enabled ClioVision preview build.
4. Open ClioVision and tap **Connect Meta glasses**.
5. Approve the handoff in Meta AI and return to ClioVision.
6. Confirm the card shows **Connected**, then use the voice button.

## Native configuration

`app.json` supplies the custom URL scheme, `fb-viewapp` query scheme, Meta external-accessory protocol, Bluetooth/accessory background modes, Bluetooth rationale, and the `MWDAT` developer-mode dictionary. The local module is auto-linked from `modules/clio-meta-wearables` during Expo prebuild.

## Not implemented yet

- DAT camera permission and first-person photo/video streaming (`MWDATCamera`)
- Android DAT native module
- release-channel App ID and universal-link production registration
- explicit display support for Meta Ray-Ban Display
- automated mock-device tests

Camera streaming should be added as a separate native capability after registration and audio routing are confirmed on the physical Wayfarers.
