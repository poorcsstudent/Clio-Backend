import ExpoModulesCore
import Foundation
internal import MWDATCore

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

private final class InvalidMetaCallbackUrlException: GenericException<String>, @unchecked Sendable {
  override var reason: String {
    "Invalid Meta callback URL: \(param)"
  }
}
