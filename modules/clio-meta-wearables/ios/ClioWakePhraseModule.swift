import AVFoundation
import ExpoModulesCore
import Foundation
import Speech

public final class ClioWakePhraseModule: Module, @unchecked Sendable {
  private let audioEngine = AVAudioEngine()
  private let speechRecognizer = SFSpeechRecognizer(locale: Locale(identifier: "en-US"))
  private var recognitionRequest: SFSpeechAudioBufferRecognitionRequest?
  private var recognitionTask: SFSpeechRecognitionTask?
  private var commandTimer: DispatchWorkItem?
  private var wakeTimeout: DispatchWorkItem?
  private var restartWorkItem: DispatchWorkItem?
  private var recognitionGeneration = 0
  private var tapInstalled = false
  private var desiredListening = false
  private var isListening = false
  private var wakeDetected = false
  private var latestCommand = ""
  private var mode = "idle"
  private var wakePhrase = "hey clio"

  public func definition() -> ModuleDefinition {
    Name("ClioWakePhrase")

    Events("onWakePhraseState", "onWakePhraseDetected", "onWakePhraseCommand")

    AsyncFunction("getState") { () -> [String: Any] in
      self.snapshot()
    }.runOnQueue(.main)

    AsyncFunction("requestPermissions") { (promise: Promise) in
      self.requestPermissions(promise: promise)
    }.runOnQueue(.main)

    AsyncFunction("start") { (phrase: String) -> [String: Any] in
      let requestedPhrase = phrase.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
      let normalizedPhrase = requestedPhrase.isEmpty ? "hey clio" : requestedPhrase
      if self.desiredListening, self.isListening, self.wakePhrase == normalizedPhrase {
        return self.snapshot()
      }
      self.wakePhrase = normalizedPhrase
      self.desiredListening = true
      try self.beginRecognition()
      return self.snapshot()
    }.runOnQueue(.main)

    AsyncFunction("stop") { () -> [String: Any] in
      self.desiredListening = false
      self.tearDownRecognition(deactivateAudio: true)
      self.mode = "idle"
      self.emitState()
      return self.snapshot()
    }.runOnQueue(.main)

    AsyncFunction("preparePlaybackRoute") { () -> [String: Any] in
      self.desiredListening = false
      self.tearDownRecognition(deactivateAudio: false)
      self.mode = "idle"
      self.emitState()
      return try self.preparePlaybackRoute()
    }.runOnQueue(.main)
  }

  private func requestPermissions(promise: Promise) {
    let requestMicrophone: @Sendable () -> Void = { [weak self] in
      guard let self else { return }

      if AVAudioSession.sharedInstance().recordPermission != .undetermined {
        promise.resolve(self.snapshot())
        return
      }

      AVAudioSession.sharedInstance().requestRecordPermission { [weak self] _ in
        DispatchQueue.main.async {
          guard let self else { return }
          promise.resolve(self.snapshot())
        }
      }
    }

    if SFSpeechRecognizer.authorizationStatus() == .notDetermined {
      SFSpeechRecognizer.requestAuthorization { _ in
        DispatchQueue.main.async(execute: requestMicrophone)
      }
    } else {
      requestMicrophone()
    }
  }

  private func beginRecognition() throws {
    guard SFSpeechRecognizer.authorizationStatus() == .authorized else {
      throw WakePhrasePermissionException("Speech recognition permission is required.")
    }
    guard AVAudioSession.sharedInstance().recordPermission == .granted else {
      throw WakePhrasePermissionException("Microphone permission is required.")
    }
    guard let speechRecognizer, speechRecognizer.isAvailable else {
      throw WakePhraseUnavailableException("English speech recognition is unavailable.")
    }
    guard speechRecognizer.supportsOnDeviceRecognition else {
      throw WakePhraseUnavailableException("On-device speech recognition is unavailable on this iPhone.")
    }

    tearDownRecognition(deactivateAudio: false)
    let generation = recognitionGeneration
    desiredListening = true
    wakeDetected = false
    latestCommand = ""
    mode = "listening"

    let audioSession = AVAudioSession.sharedInstance()
    try audioSession.setCategory(
      .record,
      mode: .measurement,
      options: [.allowBluetoothHFP]
    )
    try audioSession.setActive(true, options: .notifyOthersOnDeactivation)

    let request = SFSpeechAudioBufferRecognitionRequest()
    request.shouldReportPartialResults = true
    request.requiresOnDeviceRecognition = true
    request.taskHint = .confirmation
    request.contextualStrings = ["Hey Clio", "Clio", "Cleo", "Missouri S&T"]
    recognitionRequest = request

    let inputNode = audioEngine.inputNode
    let format = inputNode.outputFormat(forBus: 0)
    guard format.sampleRate > 0, format.channelCount > 0 else {
      throw WakePhraseUnavailableException("The active microphone route is unavailable.")
    }

    inputNode.installTap(onBus: 0, bufferSize: 1_024, format: format) { [weak request] buffer, _ in
      request?.append(buffer)
    }
    tapInstalled = true

    recognitionTask = speechRecognizer.recognitionTask(with: request) { [weak self] result, error in
      let transcript = result?.bestTranscription.formattedString
      let isFinal = result?.isFinal == true
      let hasError = error != nil
      DispatchQueue.main.async {
        guard let self, self.recognitionGeneration == generation else { return }
        self.handleRecognition(transcript: transcript, isFinal: isFinal, hasError: hasError)
      }
    }

    audioEngine.prepare()
    do {
      try audioEngine.start()
    } catch {
      desiredListening = false
      tearDownRecognition(deactivateAudio: true)
      mode = "error"
      emitState(error: error.localizedDescription)
      throw error
    }
    isListening = true
    emitState()
  }

  private func preparePlaybackRoute() throws -> [String: Any] {
    let audioSession = AVAudioSession.sharedInstance()
    try audioSession.setCategory(
      .playAndRecord,
      mode: .voicePrompt,
      options: [.allowBluetoothHFP, .defaultToSpeaker]
    )
    try audioSession.setActive(true)

    let bluetoothInput = audioSession.availableInputs?.first { input in
      input.portType == .bluetoothHFP
    }
    if let bluetoothInput {
      try audioSession.setPreferredInput(bluetoothInput)
    }

    let route = audioSession.currentRoute
    let outputNames = route.outputs.map(\.portName)
    let bluetoothSelected = route.outputs.contains { output in
      output.portType == .bluetoothHFP || output.portType == .bluetoothA2DP
    }
    return [
      "bluetoothAvailable": bluetoothInput != nil,
      "bluetoothSelected": bluetoothSelected,
      "input": route.inputs.first?.portName ?? "",
      "outputs": outputNames
    ]
  }

  private func handleRecognition(transcript: String?, isFinal: Bool, hasError: Bool) {
    guard desiredListening else { return }

    if let transcript {
      if !wakeDetected, containsWakePhrase(transcript) {
        wakeDetected = true
        mode = "awaitingCommand"
        sendEvent("onWakePhraseDetected", ["phrase": wakePhrase])
        emitState()
        scheduleWakeTimeout()
      }

      if wakeDetected {
        let command = commandAfterWakePhrase(transcript)
        if !command.isEmpty {
          latestCommand = command
          scheduleCommandCompletion()
        }
      }

      if isFinal {
        if wakeDetected, !latestCommand.isEmpty {
          finishCommand()
          return
        }
        scheduleRestart()
        return
      }
    }

    if hasError {
      scheduleRestart()
    }
  }

  private func containsWakePhrase(_ transcript: String) -> Bool {
    let words = normalizedWords(transcript)
    guard words.count >= 2 else { return false }
    for index in 0..<(words.count - 1) {
      if words[index] == "hey", ["clio", "cleo"].contains(words[index + 1]) {
        return true
      }
    }
    return false
  }

  private func commandAfterWakePhrase(_ transcript: String) -> String {
    let words = normalizedWords(transcript)
    guard words.count >= 2 else { return "" }
    for index in 0..<(words.count - 1) {
      if words[index] == "hey", ["clio", "cleo"].contains(words[index + 1]) {
        let commandStart = index + 2
        guard commandStart < words.count else { return "" }
        return words[commandStart...].joined(separator: " ")
      }
    }
    return ""
  }

  private func normalizedWords(_ value: String) -> [String] {
    value
      .lowercased()
      .components(separatedBy: CharacterSet.alphanumerics.inverted)
      .filter { !$0.isEmpty }
  }

  private func scheduleCommandCompletion() {
    commandTimer?.cancel()
    let workItem = DispatchWorkItem { [weak self] in
      self?.finishCommand()
    }
    commandTimer = workItem
    DispatchQueue.main.asyncAfter(deadline: .now() + 1.25, execute: workItem)
  }

  private func scheduleWakeTimeout() {
    wakeTimeout?.cancel()
    let workItem = DispatchWorkItem { [weak self] in
      guard let self, self.desiredListening, self.latestCommand.isEmpty else { return }
      self.mode = "listening"
      self.wakeDetected = false
      self.emitState()
      self.scheduleRestart()
    }
    wakeTimeout = workItem
    DispatchQueue.main.asyncAfter(deadline: .now() + 8, execute: workItem)
  }

  private func finishCommand() {
    let command = latestCommand.trimmingCharacters(in: .whitespacesAndNewlines)
    guard desiredListening, !command.isEmpty else { return }
    desiredListening = false
    tearDownRecognition(deactivateAudio: true)
    mode = "processing"
    emitState()
    sendEvent("onWakePhraseCommand", ["command": command])
  }

  private func scheduleRestart() {
    guard desiredListening else { return }
    restartWorkItem?.cancel()
    tearDownRecognition(deactivateAudio: false)
    let workItem = DispatchWorkItem { [weak self] in
      guard let self, self.desiredListening else { return }
      do {
        try self.beginRecognition()
      } catch {
        self.desiredListening = false
        self.mode = "error"
        self.emitState(error: error.localizedDescription)
      }
    }
    restartWorkItem = workItem
    DispatchQueue.main.asyncAfter(deadline: .now() + 0.25, execute: workItem)
  }

  private func tearDownRecognition(deactivateAudio: Bool) {
    recognitionGeneration += 1
    commandTimer?.cancel()
    commandTimer = nil
    wakeTimeout?.cancel()
    wakeTimeout = nil
    restartWorkItem?.cancel()
    restartWorkItem = nil
    recognitionRequest?.endAudio()
    recognitionTask?.cancel()
    recognitionTask = nil
    recognitionRequest = nil
    if audioEngine.isRunning { audioEngine.stop() }
    if tapInstalled {
      audioEngine.inputNode.removeTap(onBus: 0)
      tapInstalled = false
    }
    isListening = false
    wakeDetected = false
    latestCommand = ""
    if deactivateAudio {
      try? AVAudioSession.sharedInstance().setActive(false, options: .notifyOthersOnDeactivation)
    }
  }

  private func snapshot() -> [String: Any] {
    [
      "platformSupported": true,
      "moduleLoaded": true,
      "onDeviceSupported": speechRecognizer?.supportsOnDeviceRecognition == true,
      "speechAuthorized": SFSpeechRecognizer.authorizationStatus() == .authorized,
      "microphoneAuthorized": AVAudioSession.sharedInstance().recordPermission == .granted,
      "listening": isListening,
      "mode": mode,
      "phrase": wakePhrase
    ]
  }

  private func emitState(error: String? = nil) {
    var state = snapshot()
    if let error { state["error"] = error }
    sendEvent("onWakePhraseState", state)
  }

}

private final class WakePhrasePermissionException: GenericException<String>, @unchecked Sendable {
  override var reason: String { param }
}

private final class WakePhraseUnavailableException: GenericException<String>, @unchecked Sendable {
  override var reason: String { param }
}
