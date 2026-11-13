import ExpoModulesCore
import Foundation
internal import MWDATCore
internal import MWDATCamera
import UIKit

public final class ClioMetaWearablesModule: Module, @unchecked Sendable {
  private let configurationLock = NSLock()
  private var isConfigured = false

  public func definition() -> ModuleDefinition {
    Name("ClioMetaWearables")

    AsyncFunction("configure") { () -> [String: Any] in
      try self.ensureConfigured()
      return self.snapshot()
    }

    AsyncFunction("getState") { () -> [String: Any] in
      try self.ensureConfigured()
      return self.snapshot()
    }

    AsyncFunction("startRegistration") { () -> [String: Any] in
      try self.ensureConfigured()
      try await Wearables.shared.startRegistration()
      return self.snapshot()
    }

    AsyncFunction("handleUrl") { (urlString: String) -> [String: Any] in
      try self.ensureConfigured()
      guard let url = URL(string: urlString) else {
        throw InvalidMetaCallbackUrlException(urlString)
      }

      let handled = try await Wearables.shared.handleUrl(url)
      var state = self.snapshot()
      state["handled"] = handled
      return state
    }

    AsyncFunction("unregister") { () -> [String: Any] in
      try self.ensureConfigured()
      try await Wearables.shared.startUnregistration()
      return self.snapshot()
    }

    AsyncFunction("requestCameraPermission") { () -> String in
      try self.ensureConfigured()
      let status = try await Wearables.shared.requestPermission(.camera)
      return status == .granted ? "granted" : "denied"
    }

    AsyncFunction("capturePhoto") { () -> [String: Any] in
      try self.ensureConfigured()
      return try await self.captureStillPhoto()
    }
  }

  private func captureStillPhoto() async throws -> [String: Any] {
    let permission = try await Wearables.shared.requestPermission(.camera)
    guard permission == .granted else {
      throw MetaCameraException("Camera access was not granted in Meta AI.")
    }

    let selector = AutoDeviceSelector(wearables: Wearables.shared)
    let session = try Wearables.shared.createSession(deviceSelector: selector)
    var cameraStream: MWDATCamera.Stream?

    do {
      try session.start()
      try await waitForSession(session)

      let configuration = StreamConfiguration(
        videoCodec: .raw,
        resolution: .low,
        frameRate: 5
      )
      guard let stream = try session.addStream(config: configuration) else {
        throw MetaCameraException("The glasses did not create a camera stream.")
      }
      cameraStream = stream
      await stream.start()
      try await waitForStream(stream)

      let photo = try await waitForPhoto(from: stream)
      let encoded = try encodeForVision(photo)
      await stream.stop()
      session.stop()
      return encoded
    } catch {
      if let cameraStream {
        await cameraStream.stop()
      }
      session.stop()
      throw error
    }
  }

  private func waitForSession(_ session: DeviceSession) async throws {
    let deadline = Date().addingTimeInterval(15)
    while Date() < deadline {
      switch session.state {
      case .started:
        return
      case .stopped:
        throw MetaCameraException("The Meta device session stopped before the camera was ready.")
      default:
        try await Task.sleep(for: .milliseconds(100))
      }
    }
    throw MetaCameraException("The Meta device session timed out.")
  }

  private func waitForStream(_ stream: MWDATCamera.Stream) async throws {
    let deadline = Date().addingTimeInterval(20)
    while Date() < deadline {
      switch stream.state {
      case .streaming:
        return
      case .stopped:
        throw MetaCameraException("The glasses camera stream stopped before it was ready.")
      default:
        try await Task.sleep(for: .milliseconds(100))
      }
    }
    throw MetaCameraException("The glasses camera stream timed out.")
  }

  private func waitForPhoto(from stream: MWDATCamera.Stream) async throws -> PhotoData {
    try await withCheckedThrowingContinuation { continuation in
      let capture = MetaPhotoCapture(continuation: continuation)
      let photoToken = stream.photoDataPublisher.listen { photo in
        capture.finish(.success(photo))
      }
      let errorToken = stream.errorPublisher.listen { error in
        capture.finish(.failure(error))
      }
      capture.install(photoToken: photoToken, errorToken: errorToken)

      Task {
        try? await Task.sleep(for: .seconds(12))
        capture.finish(.failure(MetaCameraException("The glasses did not return a photo in time.")))
      }

      guard stream.capturePhoto(format: .jpeg) else {
        capture.finish(.failure(MetaCameraException("The glasses rejected the photo request.")))
        return
      }
    }
  }

  private func encodeForVision(_ photo: PhotoData) throws -> [String: Any] {
    guard let sourceImage = UIImage(data: photo.data) else {
      throw MetaCameraException("The glasses returned an unreadable image.")
    }

    let maximumDimension: CGFloat = 1_280
    let originalSize = sourceImage.size
    let scale = min(1, maximumDimension / max(originalSize.width, originalSize.height))
    let targetSize = CGSize(
      width: max(1, (originalSize.width * scale).rounded()),
      height: max(1, (originalSize.height * scale).rounded())
    )
    let format = UIGraphicsImageRendererFormat()
    format.scale = 1
    let image = UIGraphicsImageRenderer(size: targetSize, format: format).image { _ in
      sourceImage.draw(in: CGRect(origin: .zero, size: targetSize))
    }
    guard let data = image.jpegData(compressionQuality: 0.72) else {
      throw MetaCameraException("The captured image could not be prepared for identification.")
    }

    return [
      "base64": data.base64EncodedString(),
      "mimeType": "image/jpeg",
      "width": Int(targetSize.width),
      "height": Int(targetSize.height)
    ]
  }

  private func ensureConfigured() throws {
    configurationLock.lock()
    defer { configurationLock.unlock() }

    guard !isConfigured else { return }
    try Wearables.configure()
    isConfigured = true
  }

  private func snapshot() -> [String: Any] {
    let wearables = Wearables.shared
    let devices = wearables.devices.compactMap { identifier -> [String: Any]? in
      guard let device = wearables.deviceForIdentifier(identifier) else { return nil }
      return [
        "id": identifier,
        "name": device.nameOrId(),
        "linkState": linkStateName(device.linkState),
        "deviceType": device.deviceType().rawValue,
        "compatibility": device.compatibility().displayString
      ]
    }

    return [
      "platformSupported": true,
      "sdkLoaded": true,
      "sdkVersion": "0.7.0",
      "registrationState": registrationStateName(wearables.registrationState),
      "devices": devices
    ]
  }

  private func registrationStateName(_ state: MWDATCore.RegistrationState) -> String {
    switch state {
    case .unavailable:
      return "unavailable"
    case .available:
      return "available"
    case .registering:
      return "registering"
    case .registered:
      return "registered"
    }
  }

  private func linkStateName(_ state: LinkState) -> String {
    switch state {
    case .disconnected:
      return "disconnected"
    case .connecting:
      return "connecting"
    case .connected:
      return "connected"
    }
  }
}

private final class MetaPhotoCapture: @unchecked Sendable {
  private let lock = NSLock()
  private var continuation: CheckedContinuation<PhotoData, Error>?
  private var photoToken: (any AnyListenerToken)?
  private var errorToken: (any AnyListenerToken)?

  init(continuation: CheckedContinuation<PhotoData, Error>) {
    self.continuation = continuation
  }

  func install(
    photoToken: any AnyListenerToken,
    errorToken: any AnyListenerToken
  ) {
    lock.lock()
    self.photoToken = photoToken
    self.errorToken = errorToken
    lock.unlock()
  }

  func finish(_ result: Result<PhotoData, Error>) {
    lock.lock()
    guard let continuation else {
      lock.unlock()
      return
    }
    self.continuation = nil
    let photoToken = self.photoToken
    let errorToken = self.errorToken
    self.photoToken = nil
    self.errorToken = nil
    lock.unlock()

    continuation.resume(with: result)
    Task {
      await photoToken?.cancel()
      await errorToken?.cancel()
    }
  }
}

private final class InvalidMetaCallbackUrlException: GenericException<String>, @unchecked Sendable {
  override var reason: String {
    "Invalid Meta callback URL: \(param)"
  }
}

private final class MetaCameraException: GenericException<String>, @unchecked Sendable {
  override var reason: String { param }
}
