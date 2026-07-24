import AVFoundation
import ExpoModulesCore
import Foundation
import Speech

private enum ClioRecognitionPurpose {
  case wakePhrase
  case command
}

public final class ClioWakePhraseModule: Module, @unchecked Sendable {
  private let audioEngine = AVAudioEngine()
  private let speechSynthesizer = AVSpeechSynthesizer()
  private let speechRecognizer = SFSpeechRecognizer(locale: Locale(identifier: "en-US"))
  private lazy var speechDelegate = ClioSpeechSynthesizerDelegate(owner: self)
  private var speechKinds: [ObjectIdentifier: String] = [:]
  private var recognitionRequest: SFSpeechAudioBufferRecognitionRequest?
  private var recognitionTask: SFSpeechRecognitionTask?
  private var commandTimer: DispatchWorkItem?
  private var wakeTimeout: DispatchWorkItem?
  private var restartWorkItem: DispatchWorkItem?
  private var commandCaptureWorkItem: DispatchWorkItem?
  private var recognitionGeneration = 0
  private var tapInstalled = false
  private var desiredListening = false
  private var isListening = false
  private var wakeDetected = false
  private var latestCommand = ""
  private var recognitionPurpose = ClioRecognitionPurpose.wakePhrase
  private var mode = "idle"
  private var wakePhrase = "hey clio"

  public func definition() -> ModuleDefinition {
    Name("ClioWakePhrase")

    Events(
      "onWakePhraseState",
      "onWakePhraseDetected",
      "onWakePhraseCommand",
      "onWakePhraseDiagnostic",
      "onNativeSpeechState"
    )

    AsyncFunction("getState") { () -> [String: Any] in
      self.snapshot()
    }.runOnQueue(.main)

    AsyncFunction("requestPermissions") { (promise: Promise) in
      self.requestPermissions(promise: promise)
    }.runOnQueue(.main)

    AsyncFunction("start") { (phrase: String) -> [String: Any] in
      let requestedPhrase = phrase.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
      let normalizedPhrase = requestedPhrase.isEmpty ? "hey clio" : requestedPhrase
      if self.desiredListening,
         (self.isListening || self.mode == "awaitingCommand"),
         self.wakePhrase == normalizedPhrase {
        return self.snapshot()
      }
      self.wakePhrase = normalizedPhrase
      self.desiredListening = true
      try self.beginRecognition()
      return self.snapshot()
    }.runOnQueue(.main)

    AsyncFunction("stop") { () -> [String: Any] in
      let shouldDeactivateAudio =
        self.desiredListening || self.isListening || self.audioEngine.isRunning
      self.desiredListening = false
      self.tearDownRecognition(deactivateAudio: shouldDeactivateAudio)
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

    AsyncFunction("speakAnswer") { (text: String) -> [String: Any] in
      let spokenText = text.trimmingCharacters(in: .whitespacesAndNewlines)
      guard !spokenText.isEmpty else {
        throw WakePhraseUnavailableException("The answer text is empty.")
      }

      self.desiredListening = false
      self.tearDownRecognition(deactivateAudio: false)
      self.mode = "processing"
      self.emitState()

      let route = try self.preparePlaybackRoute()
      self.speechSynthesizer.delegate = self.speechDelegate
      if self.speechSynthesizer.isSpeaking || self.speechSynthesizer.isPaused {
        self.speechSynthesizer.stopSpeaking(at: .immediate)
      }

      let utterance = AVSpeechUtterance(string: spokenText)
      utterance.voice = AVSpeechSynthesisVoice(language: "en-US")
      utterance.rate = AVSpeechUtteranceDefaultSpeechRate * 0.92
      utterance.volume = 1
      self.speechKinds[ObjectIdentifier(utterance)] = "answer"
      self.speechSynthesizer.speak(utterance)
      self.emitNativeSpeechState(
        kind: "answer",
        stage: "queued",
        message: "Queued the exact answer bubble text for native iOS speech."
      )
      return route
    }.runOnQueue(.main)

    AsyncFunction("stopSpeaking") { () -> Bool in
      let wasSpeaking = self.speechSynthesizer.isSpeaking || self.speechSynthesizer.isPaused
      if wasSpeaking {
        self.speechSynthesizer.stopSpeaking(at: .immediate)
      }
      return wasSpeaking
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

  private func beginRecognition(
    purpose: ClioRecognitionPurpose = .wakePhrase
  ) throws {
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
    recognitionPurpose = purpose
    wakeDetected = purpose == .command
    latestCommand = ""
    mode = purpose == .command ? "awaitingCommand" : "listening"

    let audioSession = AVAudioSession.sharedInstance()
    try audioSession.setCategory(
      .playAndRecord,
      mode: .voiceChat,
      options: [.allowBluetoothHFP, .defaultToSpeaker]
    )
    try audioSession.setActive(true, options: .notifyOthersOnDeactivation)

    if let bluetoothInput = audioSession.availableInputs?.first(where: { input in
      input.portType == .bluetoothHFP
    }) {
      try audioSession.setPreferredInput(bluetoothInput)
    }

    let request = SFSpeechAudioBufferRecognitionRequest()
    request.shouldReportPartialResults = true
    request.requiresOnDeviceRecognition = true
    request.taskHint = purpose == .command ? .dictation : .confirmation
    request.contextualStrings =
      purpose == .command
        ? ["Missouri S&T", "campus", "building", "Clio"]
        : ["Hey Clio", "Clio", "Cleo", "Missouri S&T"]
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
    emitDiagnostic(
      stage: purpose == .command ? "commandListenerStarted" : "listenerStarted",
      message:
        purpose == .command
          ? "Fresh command listener started after the acknowledgement."
          : "Wake listener started on the active iOS audio route."
    )
    emitState()
    if purpose == .command {
      scheduleWakeTimeout()
    }
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

    let route = routeSnapshot()
    emitDiagnostic(
      stage: "answerRoutePrepared",
      message: "Prepared the iOS route for answer playback."
    )
    return route
  }

  private func handleRecognition(transcript: String?, isFinal: Bool, hasError: Bool) {
    guard desiredListening else { return }

    if recognitionPurpose == .command {
      handleCommandRecognition(transcript: transcript, isFinal: isFinal, hasError: hasError)
      return
    }

    if let transcript {
      if !wakeDetected, containsWakePhrase(transcript) {
        wakeDetected = true
        mode = "awaitingCommand"
        sendEvent("onWakePhraseDetected", ["phrase": wakePhrase])
        emitDiagnostic(
          stage: "wakeDetected",
          message: "Detected Hey Clio on-device."
        )
        tearDownRecognition(deactivateAudio: false, resetCapture: false)
        desiredListening = true
        wakeDetected = true
        mode = "awaitingCommand"
        speakDiagnosticAcknowledgement()
        emitState()
        scheduleCommandCapture(after: 3)
        return
      }

      if isFinal {
        scheduleRestart()
        return
      }
    }

    if hasError {
      scheduleRestart()
    }
  }

  private func handleCommandRecognition(
    transcript: String?,
    isFinal: Bool,
    hasError: Bool
  ) {
    if let transcript {
      let command = transcript.trimmingCharacters(in: .whitespacesAndNewlines)
      if !command.isEmpty {
        let firstSpeech = latestCommand.isEmpty
        latestCommand = command
        if firstSpeech {
          emitDiagnostic(
            stage: "commandSpeechDetected",
            message: "Question speech reached the fresh command listener."
          )
        }
        scheduleCommandCompletion()
      }

      if isFinal {
        if !latestCommand.isEmpty {
          finishCommand()
        }
        return
      }
    }

    if hasError {
      if !latestCommand.isEmpty {
        finishCommand()
        return
      }
      emitDiagnostic(
        stage: "commandCaptureError",
        message: "The command listener ended before hearing a question; returning to wake mode."
      )
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

  private func normalizedWords(_ value: String) -> [String] {
    value
      .lowercased()
      .components(separatedBy: CharacterSet.alphanumerics.inverted)
      .filter { !$0.isEmpty }
  }

  private func speakDiagnosticAcknowledgement() {
    speechSynthesizer.delegate = speechDelegate
    if speechSynthesizer.isSpeaking || speechSynthesizer.isPaused {
      speechSynthesizer.stopSpeaking(at: .immediate)
    }

    let utterance = AVSpeechUtterance(string: "Hey User")
    utterance.voice = AVSpeechSynthesisVoice(language: "en-US")
    utterance.rate = AVSpeechUtteranceDefaultSpeechRate * 0.9
    utterance.volume = 1
    speechKinds[ObjectIdentifier(utterance)] = "acknowledgement"
    speechSynthesizer.speak(utterance)
    emitDiagnostic(
      stage: "acknowledgementQueued",
      message: "Queued the local Hey User acknowledgement."
    )
    emitNativeSpeechState(
      kind: "acknowledgement",
      stage: "queued",
      message: "Queued the local Hey User acknowledgement with native iOS speech."
    )
  }

  private func routeSnapshot() -> [String: Any] {
    let audioSession = AVAudioSession.sharedInstance()
    let route = audioSession.currentRoute
    let bluetoothAvailable = audioSession.availableInputs?.contains { input in
      input.portType == .bluetoothHFP
    } == true
    let bluetoothSelected = route.outputs.contains { output in
      output.portType == .bluetoothHFP || output.portType == .bluetoothA2DP
    }
    return [
      "bluetoothAvailable": bluetoothAvailable,
      "bluetoothSelected": bluetoothSelected,
      "input": route.inputs.first?.portName ?? "",
      "outputs": route.outputs.map(\.portName)
    ]
  }

  private func emitDiagnostic(stage: String, message: String) {
    var event = routeSnapshot()
    event["stage"] = stage
    event["message"] = message
    sendEvent("onWakePhraseDiagnostic", event)
  }

  fileprivate func handleSpeechSynthesizerEvent(
    stage: String,
    utterance: AVSpeechUtterance
  ) {
    let identifier = ObjectIdentifier(utterance)
    guard let kind = speechKinds[identifier] else { return }

    let messages = [
      "started": "Native iOS speech started.",
      "finished": "Native iOS speech finished.",
      "cancelled": "Native iOS speech was cancelled."
    ]
    emitNativeSpeechState(
      kind: kind,
      stage: stage,
      message: messages[stage] ?? "Native iOS speech changed state."
    )

    if stage == "finished" || stage == "cancelled" {
      speechKinds.removeValue(forKey: identifier)
      if kind == "acknowledgement" {
        scheduleCommandCapture(after: stage == "finished" ? 0.2 : 0.4)
      } else if kind == "answer" {
        mode = "idle"
        emitState()
      }
    }
  }

  private func emitNativeSpeechState(kind: String, stage: String, message: String) {
    var event = routeSnapshot()
    event["kind"] = kind
    event["stage"] = stage
    event["message"] = message
    sendEvent("onNativeSpeechState", event)
  }

  private func scheduleCommandCompletion() {
    commandTimer?.cancel()
    let workItem = DispatchWorkItem { [weak self] in
      self?.finishCommand()
    }
    commandTimer = workItem
    DispatchQueue.main.asyncAfter(deadline: .now() + 1.25, execute: workItem)
  }

  private func scheduleCommandCapture(after delay: TimeInterval) {
    guard desiredListening, mode == "awaitingCommand" else { return }
    commandCaptureWorkItem?.cancel()
    let workItem = DispatchWorkItem { [weak self] in
      guard let self, self.desiredListening, self.mode == "awaitingCommand" else { return }
      do {
        try self.beginRecognition(purpose: .command)
      } catch {
        self.desiredListening = false
        self.mode = "error"
        self.emitState(error: error.localizedDescription)
      }
    }
    commandCaptureWorkItem = workItem
    DispatchQueue.main.asyncAfter(deadline: .now() + delay, execute: workItem)
  }

  private func scheduleWakeTimeout() {
    wakeTimeout?.cancel()
    let workItem = DispatchWorkItem { [weak self] in
      guard let self, self.desiredListening, self.latestCommand.isEmpty else { return }
      self.emitDiagnostic(
        stage: "commandTimeout",
        message: "No question was heard after Hey User; returning to the wake listener."
      )
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
        try self.beginRecognition(purpose: .wakePhrase)
      } catch {
        self.desiredListening = false
        self.mode = "error"
        self.emitState(error: error.localizedDescription)
      }
    }
    restartWorkItem = workItem
    DispatchQueue.main.asyncAfter(deadline: .now() + 0.25, execute: workItem)
  }

  private func tearDownRecognition(
    deactivateAudio: Bool,
    resetCapture: Bool = true
  ) {
    recognitionGeneration += 1
    commandTimer?.cancel()
    commandTimer = nil
    wakeTimeout?.cancel()
    wakeTimeout = nil
    restartWorkItem?.cancel()
    restartWorkItem = nil
    commandCaptureWorkItem?.cancel()
    commandCaptureWorkItem = nil
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
    if resetCapture {
      recognitionPurpose = .wakePhrase
      wakeDetected = false
      latestCommand = ""
    }
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

private final class ClioSpeechSynthesizerDelegate:
  NSObject,
  AVSpeechSynthesizerDelegate,
  @unchecked Sendable
{
  private weak var owner: ClioWakePhraseModule?

  init(owner: ClioWakePhraseModule) {
    self.owner = owner
  }

  func speechSynthesizer(
    _ synthesizer: AVSpeechSynthesizer,
    didStart utterance: AVSpeechUtterance
  ) {
    owner?.handleSpeechSynthesizerEvent(stage: "started", utterance: utterance)
  }

  func speechSynthesizer(
    _ synthesizer: AVSpeechSynthesizer,
    didFinish utterance: AVSpeechUtterance
  ) {
    owner?.handleSpeechSynthesizerEvent(stage: "finished", utterance: utterance)
  }

  func speechSynthesizer(
    _ synthesizer: AVSpeechSynthesizer,
    didCancel utterance: AVSpeechUtterance
  ) {
    owner?.handleSpeechSynthesizerEvent(stage: "cancelled", utterance: utterance)
  }
}

private final class WakePhrasePermissionException: GenericException<String>, @unchecked Sendable {
  override var reason: String { param }
}

private final class WakePhraseUnavailableException: GenericException<String>, @unchecked Sendable {
  override var reason: String { param }
}
